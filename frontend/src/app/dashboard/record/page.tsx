"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error("Error starting camera:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  // Placeholder for starting the streaming process
  const startStreaming = () => {
    // Add your streaming logic here
    setIsStreaming(true);
    console.log("Streaming started");
  };

  // Placeholder for stopping the streaming process
  const stopStreaming = () => {
    // Add your stop streaming logic here
    setIsStreaming(false);
    console.log("Streaming stopped");
  };

  // Handle video upload and analysis
  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Implement your upload logic here (e.g., send to server, run analysis, etc.)
    console.log("Video uploaded for analysis");
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">
      {/* Left Column */}
      <div className="w-full md:w-1/2 space-y-4">
        {/* Live Camera Card */}
        <Card>
          <CardHeader>
            <CardTitle>Live Camera</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isCameraOn ? "Camera is active" : "Camera is off"}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <video
              ref={videoRef}
              className="rounded-md border"
              autoPlay
              muted
              playsInline
              width={400}
              height={300}
            />
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button variant="default" onClick={startCamera}>
              Start Camera
            </Button>
            <Button variant="secondary" onClick={stopCamera}>
              Stop Camera
            </Button>
            <Button variant="default" onClick={startStreaming}>
              Start Streaming
            </Button>
            <Button variant="secondary" onClick={stopStreaming}>
              Stop Streaming
            </Button>
          </CardFooter>
        </Card>

        {/* Upload Video Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="flex flex-col gap-2">
              <Input type="file" accept="video/*" />
              <Button type="submit">Upload &amp; Analyze</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Column */}
      <div className="w-full md:w-1/2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <p className="text-sm text-muted-foreground">
              No results yet. Either upload a video or connect to the camera stream.
            </p>
            {/* Once you have analysis results, you can display them here */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
