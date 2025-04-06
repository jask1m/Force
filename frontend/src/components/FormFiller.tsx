"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Mic, Square, Loader2, ArrowRight, Check, RefreshCw } from "lucide-react";

// Sample form fields from DS-1843 Medical History and Examination Form
const formFields = {
  "demographic": [
    "Name of Examinee (Last, First, MI)",
    "Date of Birth (mm-dd-yyyy)",
    "Place of Birth",
    "Sex",
    "Email Address"
  ],
  "medicalHistory": [
    "Frequent/severe headaches or migraines",
    "Fainting, dizzy episodes, or syncope",
    "Stroke, TIA or head injury",
    "Seizures or other neurologic disorders",
    "Eye or vision problems",
    "Ear, nose, throat problems, hearing loss, hoarseness",
    "Allergies or history of anaphylactic reaction",
    "Shortness of breath, asthma, or COPD",
    "History of abnormal chest x-ray"
  ],
  "medications": [
    "Current Medications (include prescription, over the counter, vitamins, and herbs)"
  ]
};

export default function FormFiller() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingTimerId, setRecordingTimerId] = useState<NodeJS.Timeout | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [filledFields, setFilledFields] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState<"demographic" | "medicalHistory" | "medications">("demographic");
  const [formProgress, setFormProgress] = useState(0);
  
  // Mock function to simulate recording
  const startRecording = () => {
    setIsRecording(true);
    // Start a timer to track recording duration
    const timerId = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    setRecordingTimerId(timerId);
  };

  // Mock function to simulate stopping recording and processing with AI
  const stopRecording = () => {
    if (recordingTimerId) {
      clearInterval(recordingTimerId);
      setRecordingTimerId(null);
    }
    setIsRecording(false);
    setIsAnalyzing(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      // Mock AI transcription and field extraction
      let mockTranscription = "";
      let mockFields: Record<string, string> = {};
      
      if (currentSection === "demographic") {
        mockTranscription = "My name is John Smith, born on January 15, 1980 in Chicago, Illinois. I'm male and my email is john.smith@example.com.";
        mockFields = {
          "Name of Examinee (Last, First, MI)": "Smith, John A.",
          "Date of Birth (mm-dd-yyyy)": "01-15-1980",
          "Place of Birth": "Chicago, Illinois",
          "Sex": "Male",
          "Email Address": "john.smith@example.com"
        };
      } else if (currentSection === "medicalHistory") {
        mockTranscription = "I occasionally get migraines about once a month. I've never fainted or had a stroke. I don't have seizures. I wear glasses for mild nearsightedness. No hearing problems. I'm allergic to peanuts. No breathing issues or abnormal chest x-rays.";
        mockFields = {
          "Frequent/severe headaches or migraines": "Yes - Migraines once per month",
          "Fainting, dizzy episodes, or syncope": "No",
          "Stroke, TIA or head injury": "No",
          "Seizures or other neurologic disorders": "No",
          "Eye or vision problems": "Yes - Mild nearsightedness, wears glasses",
          "Ear, nose, throat problems, hearing loss, hoarseness": "No",
          "Allergies or history of anaphylactic reaction": "Yes - Peanut allergy",
          "Shortness of breath, asthma, or COPD": "No",
          "History of abnormal chest x-ray": "No"
        };
      } else if (currentSection === "medications") {
        mockTranscription = "I take a daily multivitamin and Sumatriptan as needed for migraines.";
        mockFields = {
          "Current Medications (include prescription, over the counter, vitamins, and herbs)": "Daily multivitamin, Sumatriptan (as needed for migraines)"
        };
      }
      
      setTranscription(mockTranscription);
      setFilledFields(prev => ({...prev, ...mockFields}));
      setIsAnalyzing(false);
      
      // Update progress
      if (currentSection === "demographic") {
        setFormProgress(33);
      } else if (currentSection === "medicalHistory") {
        setFormProgress(66);
      } else if (currentSection === "medications") {
        setFormProgress(100);
      }
    }, 2000);
  };

  // Move to next section
  const goToNextSection = () => {
    if (currentSection === "demographic") {
      setCurrentSection("medicalHistory");
    } else if (currentSection === "medicalHistory") {
      setCurrentSection("medications");
    }
    setTranscription(null);
  };

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Medical Form Assistant</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Visualization */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-2 transition-all duration-200 shadow-md">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                DS-1843: Medical History and Examination Form
              </CardTitle>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${formProgress}%` }}
                ></div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Demographic Section */}
                <div className={`space-y-4 ${currentSection !== "demographic" && formProgress > 0 ? "opacity-60" : ""}`}>
                  <h3 className="text-lg font-semibold border-b pb-1">I. Demographic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formFields.demographic.map((field) => (
                      <div key={field} className="space-y-1">
                        <div className="text-sm font-medium">{field}</div>
                        <div className={`p-2 bg-gray-50 border rounded-md min-h-[40px] ${filledFields[field] ? "border-primary/50 bg-primary/5" : ""}`}>
                          {filledFields[field] && (
                            <div className="flex items-center">
                              <span>{filledFields[field]}</span>
                              {field in filledFields && <Check className="ml-auto h-4 w-4 text-primary" />}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Medical History Section */}
                <div className={`space-y-4 ${currentSection !== "medicalHistory" ? (formProgress < 33 ? "opacity-50" : "opacity-60") : ""}`}>
                  <h3 className="text-lg font-semibold border-b pb-1">II. Medical History</h3>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 text-sm">Question</th>
                        <th className="text-center p-2 text-sm w-16">Yes</th>
                        <th className="text-center p-2 text-sm w-16">No</th>
                        <th className="text-left p-2 text-sm">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formFields.medicalHistory.map((field) => {
                        const answer = filledFields[field] || "";
                        const isYes = answer?.startsWith("Yes");
                        const details = isYes ? answer.substring(5) : "";
                        
                        return (
                          <tr key={field} className="border-b">
                            <td className="p-2 text-sm">{field}</td>
                            <td className="text-center p-2">
                              {isYes && <div className="h-4 w-4 rounded-sm bg-primary mx-auto" />}
                            </td>
                            <td className="text-center p-2">
                              {answer?.startsWith("No") && <div className="h-4 w-4 rounded-sm bg-primary mx-auto" />}
                            </td>
                            <td className={`p-2 text-sm ${isYes ? "text-primary" : "text-gray-500"}`}>
                              {details}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Medications Section */}
                <div className={`space-y-4 ${currentSection !== "medications" ? (formProgress < 66 ? "opacity-50" : "opacity-60") : ""}`}>
                  <h3 className="text-lg font-semibold border-b pb-1">III. Current Medications</h3>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">{formFields.medications[0]}</div>
                    <div className={`p-3 bg-gray-50 border rounded-md min-h-[80px] ${filledFields[formFields.medications[0]] ? "border-primary/50 bg-primary/5" : ""}`}>
                      {filledFields[formFields.medications[0]] ? (
                        <div className="flex items-start">
                          <span>{filledFields[formFields.medications[0]]}</span>
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recording & Transcription Section */}
        <div className="space-y-6">
          <Card className="border-2 transition-all duration-200 shadow-md">
            <CardHeader className="bg-primary/5 pb-2">
              <CardTitle className="text-lg">Record Your Information</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentSection === "demographic" && "Tell us your basic information"}
                {currentSection === "medicalHistory" && "Describe your medical history"}
                {currentSection === "medications" && "List your current medications"}
              </p>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col items-center gap-4 py-6">
                <div className={`relative rounded-full w-24 h-24 flex items-center justify-center border-4 ${isRecording ? "border-red-500 animate-pulse" : "border-primary/20"}`}>
                  <Mic className={`h-10 w-10 ${isRecording ? "text-red-500" : "text-primary/60"}`} />
                  {isRecording && (
                    <div className="absolute -top-2 -right-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      {formatTime(recordingDuration)}
                    </div>
                  )}
                </div>
                
                {!isRecording ? (
                  <Button 
                    onClick={startRecording}
                    disabled={isAnalyzing}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Start Recording
                  </Button>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={stopRecording}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                )}
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Current Section</h4>
                <div className="bg-primary/10 text-primary font-medium p-3 rounded-md text-center">
                  {currentSection === "demographic" && "Demographic Information"}
                  {currentSection === "medicalHistory" && "Medical History"}
                  {currentSection === "medications" && "Current Medications"}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Transcription Results */}
          <Card className="border-2 transition-all duration-200 shadow-md">
            <CardHeader className="bg-primary/5 pb-2">
              <CardTitle className="text-lg">AI Transcription</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isAnalyzing ? (
                <div className="h-32 flex flex-col items-center justify-center gap-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Processing your recording...</p>
                </div>
              ) : transcription ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
                    <p className="italic">{transcription}</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="font-medium text-green-700 flex items-center text-sm">
                      <Check className="h-4 w-4 mr-1" /> 
                      Form fields updated based on your recording
                    </h4>
                  </div>
                  
                  {currentSection !== "medications" ? (
                    <Button 
                      onClick={goToNextSection}
                      className="w-full flex items-center justify-center gap-1 mt-2"
                    >
                      Continue to Next Section
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-center mt-4">
                      <h4 className="font-medium text-blue-700 flex items-center justify-center text-sm">
                        <Check className="h-4 w-4 mr-1" /> 
                        Form Complete!
                      </h4>
                      <Button 
                        variant="outline"
                        className="mt-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => {
                          setCurrentSection("demographic");
                          setFilledFields({});
                          setTranscription(null);
                          setFormProgress(0);
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Start Over
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <p className="font-medium">No transcription yet</p>
                  <p className="text-xs max-w-xs">
                    Record your information using the microphone above
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