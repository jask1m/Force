"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X } from "lucide-react";

interface DocumentType {
  id: string;
  name: string;
  size: number;
  date: string;
  path?: string;
  type: "application" | "supporting"; // Document type
  extractedFields?: Record<string, any>;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<"application" | "supporting">("application");
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<DocumentType[]>([]);
  const [extracting, setExtracting] = useState<Record<string, boolean>>({});
  const [applicationDocs, setApplicationDocs] = useState<DocumentType[]>([]);
  const [supportingDocs, setSupportingDocs] = useState<DocumentType[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Update application and supporting docs whenever uploadedDocs changes
  useEffect(() => {
    setApplicationDocs(uploadedDocs.filter(doc => doc.type === "application"));
    setSupportingDocs(uploadedDocs.filter(doc => doc.type === "supporting"));
  }, [uploadedDocs]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/list-documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      if (data.documents) {
        console.log("Fetched documents:", data.documents);

        // Ensure each document has a type property
        const docsWithTypes = data.documents.map((doc: any) => {
          if (!doc.type) {
            // If type is missing, try to determine from other properties or default to "supporting"
            return { ...doc, type: doc.isApplicationForm ? "application" : "supporting" };
          }
          return doc;
        });

        setUploadedDocs(docsWithTypes);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      setDocuments([...documents, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    const updatedDocuments = [...documents];
    updatedDocuments.splice(index, 1);
    setDocuments(updatedDocuments);
  };

  const uploadDocuments = async () => {
    if (documents.length === 0) return;

    setUploading(true);

    try {
      // Create form data for file upload
      const formData = new FormData();
      documents.forEach((file) => {
        formData.append('documents', file);
      });
      // Add document type to form data
      formData.append('documentType', documentType);

      // Upload to backend
      const response = await fetch('/api/upload-documents', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload documents');
      }

      // Get uploaded documents from response
      const result = await response.json();

      // Add newly uploaded documents to the state immediately
      if (result.documents) {
        const newDocs = result.documents.map((doc: any) => ({
          ...doc,
          id: `doc-${doc.name.replace(/\s+/g, '-')}`,
          date: new Date().toLocaleDateString(),
          type: documentType // Ensure the type is set correctly based on the current documentType
        }));

        setUploadedDocs(prev => [...prev, ...newDocs]);
      } else {
        // Refresh the document list if we don't have the uploaded documents in the response
        await fetchDocuments();
      }

      // Clear the selected documents after successful upload
      setDocuments([]);
      console.log("Documents uploaded successfully");

    } catch (error) {
      console.error('Error uploading documents:', error);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = (type: "application" | "supporting") => {
    setDocumentType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Documents</h1>
          <p className="text-muted-foreground">
            View and manage your application forms and supporting documents.
          </p>
        </div>
      </div>

      {documents.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selected Files ({documentType === "application" ? "Application Forms" : "Supporting Documents"})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>{file.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Forms Card */}
      <Card>
        <CardHeader>
          <CardTitle>Application Forms</CardTitle>
          <CardDescription>
            Upload and manage your visa application forms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              id="document-upload"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />

            {applicationDocs.length > 0 ? (
              <div className="space-y-4">
                {applicationDocs.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      <div>
                        <span className="font-medium">{doc.name}</span>
                        <div className="text-xs text-muted-foreground">
                          {(doc.size / 1024).toFixed(1)} KB • Uploaded on {doc.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.extractedFields && (
                        <div className="mt-4 text-sm text-muted-foreground w-full">
                          <div className="bg-muted p-4 rounded-md prose prose-sm max-w-none">
                            <ReactMarkdown>{doc.extractedFields.result}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            setExtracting(prev => ({ ...prev, [doc.id]: true }));
                            const response = await fetch('http://localhost:8000/llama/parse-fields', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                visa_form_path: `data/documents/applications/${doc.name}`
                              })
                            });

                            if (!response.ok) {
                              throw new Error('Failed to extract fields');
                            }

                            const data = await response.json();
                            setUploadedDocs(prev =>
                              prev.map(d =>
                                d.id === doc.id
                                  ? { ...d, extractedFields: data }
                                  : d
                              )
                            );
                          } catch (error) {
                            console.error('Error extracting fields:', error);
                          } finally {
                            setExtracting(prev => ({ ...prev, [doc.id]: false }));
                          }
                        }}
                        disabled={extracting[doc.id]}
                      >
                        {extracting[doc.id] ? 'Extracting...' : 'Extract Fields'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No application forms yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Application forms you upload will appear here.
                </p>
              </div>
            )}

            <div className="flex justify-center mt-6">
              <Button variant="outline" className="mr-2" onClick={() => triggerFileInput("application")}>
                <Upload className="h-4 w-4 mr-2" />
                Select Application Forms
              </Button>
              <Button
                onClick={() => {
                  // Force documentType to "application" before uploading
                  setDocumentType("application");
                  uploadDocuments();
                }}
                disabled={documents.length === 0 || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload as Application Form'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supporting Documents Card */}
      <Card>
        <CardHeader>
          <CardTitle>Supporting Documents</CardTitle>
          <CardDescription>
            Upload and manage your supporting documents (passport, ID, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {supportingDocs.length > 0 ? (
              <div className="space-y-4">
                {supportingDocs.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-md">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      <div>
                        <span className="font-medium">{doc.name}</span>
                        <div className="text-xs text-muted-foreground">
                          {(doc.size / 1024).toFixed(1)} KB • Uploaded on {doc.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = '/dashboard'}
                      >
                        Select for Processing
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No supporting documents yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Supporting documents you upload will appear here.
                </p>
              </div>
            )}

            <div className="flex justify-center">
              <Button variant="outline" className="mr-2" onClick={() => triggerFileInput("supporting")}>
                <Upload className="h-4 w-4 mr-2" />
                Select Supporting Documents
              </Button>
              <Button
                onClick={() => {
                  // Force documentType to "supporting" before uploading
                  setDocumentType("supporting");
                  uploadDocuments();
                }}
                disabled={documents.length === 0 || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload as Supporting Document'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}