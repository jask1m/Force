"use client";

import React, { useState, useRef, useEffect } from "react";
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
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<DocumentType[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/list-documents');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        if (data.documents) {
          setUploadedDocs(data.documents);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, []);

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

      // Refresh the document list
      const refreshResponse = await fetch('/api/list-documents');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setUploadedDocs(refreshData.documents);
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

  const triggerFileInput = () => {
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
            View and manage your processed documents.
          </p>
        </div>
      </div>

      {documents.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selected Files</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            All your processed documents
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

            {uploadedDocs.length > 0 ? (
              <>
                <div className="flex justify-center mb-6">
                  <Button variant="outline" className="mr-2" onClick={triggerFileInput}>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Files
                  </Button>
                  <Button
                    onClick={uploadDocuments}
                    disabled={documents.length === 0 || uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Documents'}
                  </Button>
                </div>
                {uploadedDocs.map((doc, index) => (
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
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No documents yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Documents you upload will appear here.
                </p>
                <div className="flex justify-center mt-6">
                  <Button variant="outline" className="mr-2" onClick={triggerFileInput}>
                    <Upload className="h-4 w-4 mr-2" />
                    Select Files
                  </Button>
                  <Button
                    onClick={uploadDocuments}
                    disabled={documents.length === 0 || uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Documents'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}