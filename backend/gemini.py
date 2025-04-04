import google.genai as genai
from google.genai.types import Part
from dotenv import load_dotenv
import os
import time
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from typing import Dict, Any

load_dotenv()

router = APIRouter()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/analyze-video")
async def analyze_video(video: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Analyze a video using Google's Gemini API.
    """
    start_time = time.time()
    
    # Read the video file
    video_bytes = await video.read()
    video_load_time = time.time() - start_time
    
    # Send to Gemini API
    api_start_time = time.time()
    response = client.models.generate_content(
        model="gemini-2.0-flash-001", 
        contents=[
            Part.from_bytes(
                data=video_bytes,
                mime_type="video/mp4"
            ),
            "Analyze this video and describe:\n"
            "1. Key visual elements\n"
            "2. Audio transcript highlights\n"
            "3. Overall context and mood"
        ]
    )
    api_time = time.time() - api_start_time
    
    # Calculate total time
    total_time = time.time() - start_time
    
    # Return results
    return {
        "analysis": response.text,
        "timing": {
            "video_load_time": f"{video_load_time:.2f}s",
            "api_time": f"{api_time:.2f}s",
            "total_time": f"{total_time:.2f}s"
        }
    }

def run_direct_analysis(video_path="videos/video.mp4"):
    """Legacy function for direct script execution"""
    start_time = time.time()
    
    print("Starting video processing...")
    with open(video_path, "rb") as f: 
        video_bytes = f.read()
    print(f"Video loaded in {time.time() - start_time:.2f} seconds")
    
    print("Sending to Gemini API...")
    api_start_time = time.time()
    response = client.models.generate_content(
        model="gemini-2.0-flash-001", 
        contents=[
            Part.from_bytes(
                data=video_bytes,
                mime_type="video/mp4"
            ),
            "Analyze this video and describe:\n"
            "1. Key visual elements\n"
            "2. Audio transcript highlights\n"
            "3. Overall context and mood"
        ]
    )
    api_time = time.time() - api_start_time
    print(f"API response received in {api_time:.2f} seconds")
    
    print("Video analysis results:")
    print(response.text)
    
    total_time = time.time() - start_time
    print(f"Total processing time: {total_time:.2f} seconds")

# If the script is run directly, use the legacy function
if __name__ == "__main__":
    run_direct_analysis()
