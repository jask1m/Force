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

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
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
      setIsRecording(false);
      setRecordedChunks([]);
    }
  };

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus",
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          setRecordedChunks(chunks);
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: "video/webm" });
          await handleVideoAnalysis(blob);
        } else {
          console.error("No video data recorded");
          setAnalysisResults(
            "Error: No video data recorded. Please try again."
          );
        }
      };

      mediaRecorder.start(1000); // Collect data every second
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

  const handleVideoAnalysis = async (videoBlob: Blob) => {
    const formData = new FormData();
    console.log("videoBlob", videoBlob);
    formData.append("video", videoBlob, "recording.webm");

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

      // Save the transcription
      const saveResponse = await fetch(
        "http://localhost:8000/gemini/save-transcription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcription: data.analysis,
            source_type: "video_recording",
            metadata: {
              upload_id: data.upload_id,
              timing: data.timing,
            },
            title: `Video Recording - ${new Date().toLocaleString()}`,
          }),
        }
      );

      if (!saveResponse.ok) {
        throw new Error(`Failed to save transcription: ${saveResponse.status}`);
      }

      const saveData = await saveResponse.json();
      console.log("Transcription saved:", saveData);
    } catch (error) {
      console.error("Error:", error);
      setAnalysisResults("Error analyzing video. Please try again.");
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
              autoPlay
              muted
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
          </CardFooter>
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
                No results yet. Start recording to see analysis results.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
