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
import { ArrowRight, FileText, Video, CheckSquare } from "lucide-react";

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

export default function Dashboard() {
  // Sample videos data for demonstration
  const [videos, setVideos] = useState<Video[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Fetch documents from backend on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/list-documents');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        if (data.documents && Array.isArray(data.documents)) {
          // Transform the document structure to match our interface
          const formattedDocs = data.documents.map((doc: any) => ({
            id: doc.id || `doc-${Math.random().toString(36).substring(2)}`,
            title: doc.name || "Unnamed Document",
            type: doc.name ? doc.name.split('.').pop().toUpperCase() : "UNKNOWN",
            dateUploaded: doc.date || new Date().toLocaleDateString(),
            path: doc.path,
            selected: false
          }));
          setDocuments(formattedDocs);
        } else {
          console.log("No documents found");
          setDocuments([]);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        setDocuments([]);
      }
    };

    // Initial fetch
    fetchDocuments();

    // Refresh documents when window gets focus (user returning from documents page)
    const handleFocus = () => {
      fetchDocuments();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('focus', handleFocus);
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

  const handleProcess = () => {
    const selectedVideo = videos.find((v) => v.selected);
    const selectedDocument = documents.find((d) => d.selected);

    if (selectedVideo && selectedDocument) {
      // Process the selected video and document
      console.log("Processing:", { video: selectedVideo, document: selectedDocument });

      // Show a simple alert for demonstration
      alert(`Processing video "${selectedVideo.title}" with document "${selectedDocument.title}"`);

      // In a real app, you would send this to your backend for processing
    }
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
                      video.selected ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
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
                    onClick={() => window.location.href = '/dashboard/record'}
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
            <CardDescription>
              Select a document to be processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(documents) && documents.length > 0 ? (
                documents.map((document) => (
                  <div
                    key={document.id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      document.selected ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
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
                      onClick={() => window.location.href = '/dashboard/documents'}
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
          disabled={!videos.some(v => v.selected) || !documents.some(d => d.selected)}
        >
          Process Selected Items
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}