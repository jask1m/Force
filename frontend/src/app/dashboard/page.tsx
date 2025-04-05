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
  FileCode,
  X,
} from "lucide-react";

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
}

export default function Dashboard() {
  // Sample videos data for demonstration
  const [videos, setVideos] = useState<Video[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleVideoSelect = (id: string) => {
    setVideos(
      videos.map((video) => ({
        ...video,
        selected: video.id === id,
      }))
    );
  };

  const handleDocumentSelect = (id: string) => {
    setDocuments(
      documents.map((doc) => ({
        ...doc,
        selected: doc.id === id,
      }))
    );
  };

  const handleTranscriptionSelect = (id: string) => {
    setTranscriptions(
      transcriptions.map((trans) => ({
        ...trans,
        selected: trans.id === id,
      }))
    );
  };

  const handleProcess = () => {
    const selectedDocument = documents.find((d) => d.selected);
    const selectedTranscription = transcriptions.find((t) => t.selected);

    if (selectedDocument && selectedTranscription) {
      // Set processing state
      setIsProcessing(true);

      // Prepare the request body for the process-form endpoint
      const requestBody = {
        input_path: `data/transcriptions/${selectedTranscription.id}.md`,
        input_path_id: selectedTranscription.id,
        document_path: `data/documents/${
          selectedDocument.path?.split("data/documents/")[1]
        }`,
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">
            Select a video and document to process your application.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Videos Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Your Videos
            </CardTitle>
            <CardDescription>
              Select a video to use for processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {videos.length > 0 ? (
                videos.map((video) => (
                  <div
                    key={video.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      video.selected
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleVideoSelect(video.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted h-12 w-16 rounded flex items-center justify-center">
                        <Video className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{video.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Duration: {video.duration}
                        </p>
                      </div>
                    </div>
                    {video.selected && (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    )}
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
            <div className="space-y-4">
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

      {/* Transcriptions Section */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Your Transcriptions
            </CardTitle>
            <CardDescription>
              Select a transcription to use for processing (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(transcriptions) && transcriptions.length > 0 ? (
                transcriptions.map((transcription) => (
                  <div
                    key={transcription.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      transcription.selected
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleTranscriptionSelect(transcription.id)}
                  >
                    <div>
                      <h3 className="font-semibold">{transcription.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created on {transcription.date}
                      </p>
                    </div>
                    {transcription.selected && (
                      <CheckSquare className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileCode className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">
                    No transcriptions yet
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Transcriptions will appear here after processing videos
                  </p>
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
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto max-h-[60vh]">
                    <pre className="whitespace-pre-wrap text-sm">
                      {processingResult.result}
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
    </div>
  );
}
