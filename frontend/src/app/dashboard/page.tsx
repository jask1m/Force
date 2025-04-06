"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileText,
  Video,
  CheckSquare,
  X,
  User,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

interface Video {
  id: string;
  title: string;
  duration: string;
  thumbnail?: string;
  selected: boolean;
}

interface Document {
  id: string;
  title: string;
  type: string;
  dateUploaded: string;
  selected: boolean;
  path?: string;
}

interface Transcription {
  id: string;
  title: string;
  date: string;
  file_path: string;
  selected: boolean;
}

interface ProcessingResult {
  success: boolean;
  result?: string;
  error?: string;
  pdf_url?: string;
}

export default function Dashboard() {
  // State management for documents and transcriptions
  const [documents, setDocuments] = useState<Document[]>([]);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transcriptionContent, setTranscriptionContent] = useState("");

  // Fetch documents from backend on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("/api/list-documents");
        if (!response.ok) {
          throw new Error("Failed to fetch documents");
        }

        const data = await response.json();
        if (data.documents && Array.isArray(data.documents)) {
          // Transform the document structure to match our interface
          const formattedDocs = data.documents.map(
            (doc: {
              id?: string;
              name?: string;
              date?: string;
              path?: string;
            }) => ({
              id: doc.id || `doc-${Math.random().toString(36).substring(2)}`,
              title: doc.name || "Unnamed Document",
              type: doc.name
                ? doc.name.split(".").pop()?.toUpperCase() || "UNKNOWN"
                : "UNKNOWN",
              dateUploaded: doc.date || new Date().toLocaleDateString(),
              path: doc.path,
              selected: false,
            })
          );
          setDocuments(formattedDocs);
        } else {
          console.log("No documents found");
          setDocuments([]);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
        setDocuments([]);
      }
    };

    // Initial fetch
    fetchDocuments();

    // Refresh documents when window gets focus (user returning from documents page)
    const handleFocus = () => {
      fetchDocuments();
    };

    window.addEventListener("focus", handleFocus);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Fetch transcriptions from backend
  useEffect(() => {
    const fetchTranscriptions = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/gemini/transcriptions"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch transcriptions");
        }

        const data = await response.json();
        if (data.status === "success" && Array.isArray(data.transcriptions)) {
          // Transform the transcription structure to match our interface
          const formattedTranscriptions = data.transcriptions.map(
            (trans: {
              id: string;
              title?: string;
              date?: string;
              file_path: string;
            }) => ({
              id: trans.id,
              title: trans.title || "Untitled Transcription",
              date: trans.date || new Date().toLocaleDateString(),
              file_path: trans.file_path,
              selected: false,
            })
          );
          setTranscriptions(formattedTranscriptions);
        } else {
          console.log("No transcriptions found");
          setTranscriptions([]);
        }
      } catch (error) {
        console.error("Error fetching transcriptions:", error);
        setTranscriptions([]);
      }
    };

    // Initial fetch
    fetchTranscriptions();

    // Refresh transcriptions when window gets focus
    const handleFocus = () => {
      fetchTranscriptions();
    };

    window.addEventListener("focus", handleFocus);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Function to check for new videos (future implementation)
  // This would be replaced with actual API calls
  const checkForNewVideos = () => {
    // For now, this just uses the sample data
    console.log("Checked for new videos");
  };

  // Call this function once when component mounts
  useEffect(() => {
    checkForNewVideos();
  }, []);

  const handleDocumentSelect = (id: string) => {
    setDocuments(
      documents.map((doc) => ({
        ...doc,
        selected: doc.id === id,
      }))
    );
  };

  const handleTranscriptionSelect = (id: string) => {
    // First, deselect all transcriptions
    const updatedTranscriptions = transcriptions.map((trans) => ({
      ...trans,
      selected: trans.id === id,
    }));

    setTranscriptions(updatedTranscriptions);

    // Find the selected transcription for display
    const selected = updatedTranscriptions.find(t => t.id === id);
    if (selected) {
      setSelectedTranscription(selected);
    }
  };

  const handleViewTranscript = async (transcription: Transcription) => {
    try {
      // Get the full file path
      const filePath = transcription.file_path;
      
      if (!filePath) {
        throw new Error("Invalid file path");
      }

      // Fetch the transcription content
      const response = await fetch(`http://localhost:8000/gemini/get-transcription-content?filename=${encodeURIComponent(filePath)}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Transcription file not found");
        } else {
          throw new Error(`Failed to fetch transcription content (Status: ${response.status})`);
        }
      }

      const data = await response.json();

      if (data.status === "success") {
        setTranscriptionContent(data.content || "No content available");
        setSelectedTranscription(transcription);
        setIsDialogOpen(true);
      } else {
        throw new Error(data.message || "Failed to fetch transcription content");
      }
    } catch (error: unknown) {
      console.error("Error fetching transcription content:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setTranscriptionContent(`Error loading transcription content: ${errorMessage}`);
      setIsDialogOpen(true);
    }
  };

  const handleProcess = () => {
    const selectedDocument = documents.find((d) => d.selected);
    const selectedTranscription = transcriptions.find((t) => t.selected);

    if (selectedDocument && selectedTranscription) {
      // Set processing state
      setIsProcessing(true);

      // Prepare the request body for the process-form endpoint
      const requestBody = {
        input_path: selectedTranscription.file_path,
        input_path_id: selectedTranscription.id,
        document_path: selectedDocument.path || "",
        use_existing_index: true,
        input_filter_ids: [selectedTranscription.id],
      };

      // Send the request to the process-form endpoint
      fetch("http://localhost:8000/llama/process-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to process form");
          }
          return response.json();
        })
        .then((data) => {
          console.log("Processing result:", data);
          setProcessingResult({
            success: true,
            result: data.result || "Processing completed successfully.",
            pdf_url: data.pdf_url
          });
          setShowResults(true);
          setIsProcessing(false);
        })
        .catch((error) => {
          console.error("Error processing form:", error);
          setProcessingResult({
            success: false,
            error: error.message || "An error occurred during processing.",
          });
          setShowResults(true);
          setIsProcessing(false);
        });
    } else {
      alert("Please select both a document and a transcription to process.");
    }
  };

  const closeResults = () => {
    setShowResults(false);
  };

  const downloadPdf = async (pdfUrl: string) => {
    try {
      console.log("Downloading PDF from:", pdfUrl);
      
      // Use our proxy API instead of direct backend call
      const proxyUrl = `/api/download-pdf?url=${encodeURIComponent(pdfUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status}`);
      }
      
      // Convert response to blob
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a link element and click it to download
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfUrl.split('/').pop() || 'form.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download the PDF. See console for details.");
    }
  };

  return (
    <div className="space-y-8 max-w-full mx-auto px-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">
            Select a video and document to process your application.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Videos & Transcriptions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Your Videos & Transcriptions
            </CardTitle>
            <CardDescription>
              Select a video or transcription to use for processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 h-80 overflow-y-auto pr-2">
              {Array.isArray(transcriptions) && transcriptions.length > 0 ? (
                transcriptions.map((transcription) => (
                  <div
                    key={transcription.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      transcription.selected
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-muted h-12 w-16 rounded flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{transcription.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created on {transcription.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTranscript(transcription);
                        }}
                      >
                        View Transcript
                      </Button>
                      <Button
                        variant={transcription.selected ? "default" : "secondary"}
                        size="sm"
                        onClick={() => handleTranscriptionSelect(transcription.id)}
                      >
                        {transcription.selected ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No videos yet</h3>
                  <Button
                    className="mt-4 mx-auto flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => (window.location.href = "/dashboard/record")}
                  >
                    Record a video <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Documents
            </CardTitle>
            <CardDescription>Select a document to be processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 h-80 overflow-y-auto pr-2">
              {Array.isArray(documents) && documents.length > 0 ? (
                documents.map((document) => (
                  <div
                    key={document.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      document.selected
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleDocumentSelect(document.id)}
                  >
                    <div>
                      <h3 className="font-semibold">{document.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {document.type} • Uploaded on {document.dateUploaded}
                      </p>
                    </div>
                    {document.selected && (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
                  <Button
                    className="mt-4 mx-auto flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() =>
                      (window.location.href = "/dashboard/documents")
                    }
                  >
                    Upload a document <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleProcess}
          className="flex items-center gap-2"
          size="lg"
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Process Selected Items"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Results Modal */}
      {showResults && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="bg-white dark:bg-gray-800 h-full w-full max-w-md p-6 shadow-lg transform transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {processingResult?.success
                  ? "Processing Complete"
                  : "Processing Error"}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeResults}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-4">
              {processingResult?.success ? (
                <div className="space-y-4">
                  <p className="text-green-600 dark:text-green-400">
                    Your form has been processed successfully!
                  </p>
                  {processingResult.pdf_url && (
                    <div className="mb-6">
                      <Button 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
                        onClick={() => downloadPdf(processingResult.pdf_url as string)}
                      >
                        <FileText className="h-4 w-4" /> Download Official PDF
                      </Button>
                    </div>
                  )}
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto max-h-[60vh]">
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(processingResult.result, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-red-600 dark:text-red-400">
                    There was an error processing your form.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
                    <p className="text-sm">{processingResult?.error}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={closeResults}>Close</Button>
            </div>
          </div>
        </div>
      )}
      {/* Transcription Viewing Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTranscription?.title || "Transcript"}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-sm max-w-none overflow-auto p-4">
            <ReactMarkdown>{transcriptionContent}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
