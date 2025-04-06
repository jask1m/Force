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
import { Loader2, Video, VideoOff, Mic, Square, Play } from "lucide-react";

export default function Page() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimerId, setRecordingTimerId] = useState<NodeJS.Timeout | null>(null);

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
      
      if (recordingTimerId) {
        clearInterval(recordingTimerId);
        setRecordingTimerId(null);
      }
      setRecordingDuration(0);
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
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunks.length > 0) {
          await handleVideoAnalysis(new Blob(chunks, { type: "video/webm" }));
        } else {
          console.error("No video data recorded");
          setAnalysisResults(
            "Error: No video data recorded. Please try again."
          );
        }
        
        if (recordingTimerId) {
          clearInterval(recordingTimerId);
          setRecordingTimerId(null);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start a timer to track recording duration
      const timerId = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingTimerId(timerId);
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
    formData.append("video", videoBlob, "recording.webm");
    setIsAnalyzing(true);

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
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format JSON for better display
  const formatAnalysisResults = () => {
    if (!analysisResults) return null;
    
    try {
      const parsed = JSON.parse(analysisResults);
      
      return (
        <div className="space-y-4">
          {parsed.analysis && (
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Transcription</h3>
              <div className="bg-secondary/30 p-4 rounded-md">
                {parsed.analysis}
              </div>
            </div>
          )}
          
          {parsed.timing && (
            <div>
              <h3 className="text-lg font-medium">Processing Time</h3>
              <div className="space-y-1 text-sm">
                {typeof parsed.timing === 'object' ? (
                  <>
                    <p><span className="font-medium">Video Loading:</span> {parsed.timing.video_load_time}</p>
                    <p><span className="font-medium">API Processing:</span> {parsed.timing.api_time}</p>
                    <p><span className="font-medium">Total Time:</span> {parsed.timing.total_time}</p>
                  </>
                ) : (
                  <p>{parsed.timing} seconds</p>
                )}
              </div>
            </div>
          )}
          
          {parsed.upload_id && (
            <div>
              <p className="inline-block px-2 py-1 text-xs font-medium rounded-full border">ID: {parsed.upload_id}</p>
            </div>
          )}
        </div>
      );
    } catch {
      return (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          {analysisResults}
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Video Recording & Analysis</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Control Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-2 transition-all duration-200 shadow-md">
            <CardHeader className="pt-4 pb-2 flex justify-center items-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <CardTitle className="flex items-center gap-2 m-0">
                  <Video className="h-5 w-5" />
                  Live Camera Feed
                </CardTitle>
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium animate-pulse">
                      <div className="h-2 w-2 rounded-full bg-red-500 mr-1" />
                      REC {formatTime(recordingDuration)}
                    </div>
                  )}
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isCameraOn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {isCameraOn ? "Camera On" : "Camera Off"}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="aspect-video relative flex items-center justify-center bg-black/95">
                {!isCameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <VideoOff className="h-16 w-16 opacity-20" />
                    <p>Camera is currently off</p>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="mt-4" 
                      onClick={startCamera}
                    >
                      Turn On Camera
                    </Button>
                  </div>
                )}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
                  autoPlay
                  muted
                  playsInline
                />
                
                {isRecording && (
                  <div className="absolute top-4 right-4 h-4 w-4 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between p-4 bg-primary/5">
              <div className="flex gap-2">
                {isCameraOn ? (
                  <Button 
                    variant="outline" 
                    onClick={stopCamera}
                    className="text-destructive"
                  >
                    <VideoOff className="mr-2 h-4 w-4" />
                    Stop Camera
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    onClick={startCamera}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {isCameraOn && !isRecording ? (
                  <Button 
                    variant="default" 
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                ) : isCameraOn && isRecording ? (
                  <Button 
                    variant="outline" 
                    onClick={stopRecording}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                ) : null}
              </div>
            </CardFooter>
          </Card>
          
          {/* Instructions Card */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Start your camera by clicking the &quot;Start Camera&quot; button</li>
                <li>Click &quot;Start Recording&quot; when you&apos;re ready to begin</li>
                <li>Speak clearly for the best transcription results</li>
                <li>Click &quot;Stop Recording&quot; when finished</li>
                <li>Wait for the analysis results to appear</li>
              </ol>
            </CardContent>
          </Card>
        </div>
        
        {/* Analysis Results Section */}
        <div className="lg:col-span-1">
          <Card className="h-full border-2 transition-all duration-200 shadow-md">
            <CardHeader className="bg-primary/5 pb-2">
              <CardTitle className="text-lg">Analysis Results</CardTitle>
            </CardHeader>
            
            <CardContent className="p-4 min-h-[400px]">
              {isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p>Analyzing your recording...</p>
                  <p className="text-sm text-muted-foreground">This may take a moment</p>
                </div>
              ) : analysisResults ? (
                <div className="space-y-4">
                  {formatAnalysisResults()}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <Play className="h-12 w-12 opacity-20" />
                  <p className="font-medium">No analysis results yet</p>
                  <p className="text-sm max-w-xs">
                    Record a video using the camera controls to see your analysis here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
