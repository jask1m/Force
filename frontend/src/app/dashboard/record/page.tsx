"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
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
      setIsStreaming(false);
      setIsRecording(false);
      setRecordedChunks([]);
    }
  };

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadRecording = () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = "recorded-video.webm";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Placeholder for starting the streaming process
  const startStreaming = () => {
    setIsStreaming(true);
    console.log("Streaming started");
  };

  // Placeholder for stopping the streaming process
  const stopStreaming = () => {
    setIsStreaming(false);
    console.log("Streaming stopped");
  };

  // Handle video upload and analysis
  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!videoFile) {
      console.error("No video file selected");
      return;
    }

    const formData = new FormData();
    formData.append("video", videoFile);

    try {
      const response = await fetch(
        "http://localhost:8000/gemini/analyze-video",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResults(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Error uploading video:", error);
      setAnalysisResults("Error analyzing video. Please try again.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
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
              muted
              autoPlay
              playsInline
              width={400}
              height={300}
            />
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            {!isCameraOn ? (
              <Button variant="default" onClick={startCamera}>
                Start Camera
              </Button>
            ) : (
              <Button variant="secondary" onClick={stopCamera}>
                Stop Camera
              </Button>
            )}
            {isCameraOn && !isRecording ? (
              <Button variant="default" onClick={startRecording}>
                Start Recording
              </Button>
            ) : isCameraOn && isRecording ? (
              <Button variant="secondary" onClick={stopRecording}>
                Stop Recording
              </Button>
            ) : null}
            {recordedChunks.length > 0 && (
              <Button variant="outline" onClick={downloadRecording}>
                Download Recording
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Upload Video Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="flex flex-col gap-2">
              <Input type="file" accept="video/*" onChange={handleFileChange} />
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
            {analysisResults ? (
              <div className="whitespace-pre-wrap font-mono text-sm">
                {analysisResults}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No results yet. Either upload a video or connect to the camera
                stream.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
