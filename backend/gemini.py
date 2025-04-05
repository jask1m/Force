import google.genai as genai
from google.genai.types import Part
from dotenv import load_dotenv
import os
import time
import uuid
import subprocess
from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from typing import Dict, Any
import json

load_dotenv()

# Ensure videos directory exists
videos_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "videos")
os.makedirs(videos_dir, exist_ok=True)

# Add analysis directory for markdown output
analysis_dir = os.path.join(videos_dir, "analysis")
os.makedirs(analysis_dir, exist_ok=True)

# Add transcription directory
transcriptions_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "transcriptions")
os.makedirs(transcriptions_dir, exist_ok=True)

router = APIRouter()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/analyze-video")
async def analyze_video(video: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Analyze a video using Google's Gemini API.
    """
    start_time = time.time()
    
    # Generate a unique ID for this upload
    upload_id = f"upload_{int(start_time)}_{hash(video.filename) % 10000}"
    
    # Create analysis file for this upload
    analysis_path = os.path.join(analysis_dir, f"{upload_id}.md")
    with open(analysis_path, "w", encoding="utf-8") as f:
        f.write(f"# Video Analysis: {video.filename}\n\n")
        f.write(f"**Upload ID**: {upload_id}\n")
        f.write(f"**Start Time**: {time.ctime()}\n\n")
    
    # Read the video file
    video_bytes = await video.read()
    video_load_time = time.time() - start_time
    
    # Determine the MIME type based on file extension
    mime_type = "video/mp4"  # Default
    if video.filename.lower().endswith(".webm"):
        mime_type = "video/webm"
    
    # If it's WebM, convert to MP4 first for better compatibility
    if mime_type == "video/webm":
        # Save the uploaded WebM file
        temp_webm_path = os.path.join(videos_dir, f"temp_{upload_id}.webm")
        with open(temp_webm_path, "wb") as f:
            f.seek(0)  # Reset position after previous read
            f.write(video_bytes)
        
        # Convert WebM to MP4
        temp_mp4_path = os.path.join(videos_dir, f"temp_{upload_id}.mp4")
        convert_cmd = [
            'ffmpeg',
            '-f', 'webm',  # Force WebM format interpretation 
            '-i', temp_webm_path,
            '-c:v', 'libx264',  # Use h264 codec
            '-c:a', 'aac',      # Use AAC audio
            '-pix_fmt', 'yuv420p',  # Required format
            '-preset', 'ultrafast',  # Speed up conversion
            '-movflags', 'faststart',  # Optimize for streaming
            '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5',  # Normalize audio levels
            '-ac', '2',          # Force stereo audio
            '-b:a', '128k',     # Set audio bitrate
            '-y',  # Overwrite output
            temp_mp4_path
        ]
        
        try:
            # Run the conversion
            process = subprocess.run(convert_cmd, capture_output=True, text=True)
            
            if process.returncode != 0:
                # If conversion failed, try a more aggressive approach
                alt_convert_cmd = [
                    'ffmpeg',
                    '-f', 'lavfi', # Filtergraph input for video
                    '-i', 'color=c=black:s=640x480:r=15',  # Black background
                    '-f', 'webm',  # Force format for audio input
                    '-i', temp_webm_path,  # Use original as audio input
                    '-map', '0:v',  # Map video from first input
                    '-map', '1:a',  # Try to map audio from second input
                    '-ignore_unknown',  # Ignore unknown streams
                    '-c:v', 'libx264',  # Video codec
                    '-c:a', 'aac',  # Audio codec
                    '-af', 'loudnorm=I=-16:LRA=11:TP=-1.5',  # Normalize audio
                    '-ac', '2',     # Force stereo audio
                    '-b:a', '128k', # Set audio bitrate
                    '-shortest',    # Match shortest stream
                    '-y',           # Overwrite
                    temp_mp4_path    # Output path
                ]
                process = subprocess.run(alt_convert_cmd, capture_output=True, text=True)
            
            # If we now have a valid MP4 file, use it
            if process.returncode == 0 and os.path.exists(temp_mp4_path) and os.path.getsize(temp_mp4_path) > 1000:
                with open(temp_mp4_path, "rb") as f:
                    video_bytes = f.read()
                mime_type = "video/mp4"
        except Exception as e:
            # Log conversion error but continue with original WebM
            with open(analysis_path, "a", encoding="utf-8") as f:
                f.write(f"**Conversion Error**: {str(e)}\n\n")
                f.write("Proceeding with original WebM file.\n\n")
        
        # Clean up temp files
        try:
            if os.path.exists(temp_webm_path):
                os.remove(temp_webm_path)
            if os.path.exists(temp_mp4_path):
                os.remove(temp_mp4_path)
        except Exception as e:
            print(f"Error cleaning up temp files: {str(e)}")
    
    # Send to Gemini API
    api_start_time = time.time()
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-001", 
            contents=[
                Part.from_bytes(
                    data=video_bytes,
                    mime_type=mime_type
                ),
                "Provide a complete transcript of what the person is saying in this video.\n"
                "Focus exclusively on the spoken words and content.\n"
                "Do not analyze background sounds, audio quality, or visual elements.\n"
                "Just transcribe the speech as accurately as possible."
            ]
        )
        
        api_time = time.time() - api_start_time
        
        # Write analysis to markdown file
        with open(analysis_path, "a", encoding="utf-8") as f:
            f.write("## Analysis Results\n\n")
            f.write(f"{response.text}\n\n")
            f.write("---\n\n")
            f.write(f"**Analysis Completed**: {time.ctime()}\n")
            f.write(f"**Processing Time**: {time.time() - start_time:.2f} seconds\n")
        
        # Calculate total time
        total_time = time.time() - start_time
        
        # Return results
        return {
            "analysis": response.text,
            "timing": {
                "video_load_time": f"{video_load_time:.2f}s",
                "api_time": f"{api_time:.2f}s",
                "total_time": f"{total_time:.2f}s"
            },
            "upload_id": upload_id
        }
    
    except Exception as e:
        # Log error to markdown file
        with open(analysis_path, "a", encoding="utf-8") as f:
            f.write("## Error During Analysis\n\n")
            f.write(f"Error: {str(e)}\n\n")
            f.write(f"**Analysis Failed**: {time.ctime()}\n")
        
        # Re-raise to return error to client
        raise

@router.get("/stream-video/{video_id}")
async def stream_video(video_id: str):
    """
    Stream a video file using HTTP range requests for standard HTML5 video player compatibility.
    """
    # Use the absolute path to videos directory
    video_path = os.path.join(videos_dir, f"{video_id}.mp4")
    
    # Check if file exists
    if not os.path.isfile(video_path):
        return JSONResponse(status_code=404, content={"message": "Video not found"})
        
    # Return a streaming response that handles range requests
    return FileResponse(video_path, media_type="video/mp4")

@router.post("/save-transcription")
async def save_transcription(request: Request) -> Dict[str, Any]:
    """
    Save a transcription as a markdown file and return the file ID
    """
    try:
        # Parse the request body
        data = await request.json()
        
        # Extract data fields
        transcription = data.get("transcription", "")
        source_type = data.get("source_type", "unknown")
        metadata = data.get("metadata", {})
        title = data.get("title", "Untitled Transcription")
        
        # Generate a unique ID for this transcription
        transcription_id = f"trans_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        
        # Create a markdown file path
        md_path = os.path.join(transcriptions_dir, f"{transcription_id}.md")
        
        # Write the markdown file with metadata and transcription
        with open(md_path, "w", encoding="utf-8") as f:
            # Write title and metadata
            f.write(f"# {title}\n\n")
            f.write(f"**ID**: {transcription_id}\n")
            f.write(f"**Date**: {time.ctime()}\n")
            f.write(f"**Source**: {source_type}\n")
            
            # Write any additional metadata
            if metadata:
                f.write("\n## Metadata\n\n")
                for key, value in metadata.items():
                    f.write(f"**{key}**: {value}\n")
            
            # Write the transcription
            f.write("\n## Transcription\n\n")
            f.write(transcription)
            
            # Write footer
            f.write("\n\n---\n")
            f.write(f"Generated on {time.ctime()}")
        
        # Return success and file ID
        return {
            "status": "success",
            "transcription_id": transcription_id,
            "file_path": md_path
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to save transcription: {str(e)}"
            }
        )

@router.get("/transcriptions")
async def list_transcriptions() -> Dict[str, Any]:
    """
    List all saved transcriptions
    """
    try:
        transcriptions = []
        
        # List all markdown files in the transcriptions directory
        for filename in os.listdir(transcriptions_dir):
            if filename.endswith(".md"):
                file_path = os.path.join(transcriptions_dir, filename)
                
                # Extract basic info from the file
                title = "Untitled"
                date = ""
                
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                        if lines and lines[0].startswith("# "):
                            title = lines[0][2:].strip()
                        
                        # Look for date in the first few lines
                        for line in lines[:5]:
                            if "**Date**:" in line:
                                date = line.split("**Date**:", 1)[1].strip()
                                break
                except:
                    # If we can't read the file, use fallback info
                    pass
                
                # Add to list of transcriptions
                transcriptions.append({
                    "id": filename[:-3],  # Remove .md extension
                    "title": title,
                    "date": date,
                    "file_path": file_path
                })
        
        # Return the list, sorted by newest first
        return {
            "status": "success",
            "transcriptions": sorted(transcriptions, key=lambda x: x["id"], reverse=True)
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to list transcriptions: {str(e)}"
            }
        )

@router.get("/transcription/{transcription_id}")
async def get_transcription(transcription_id: str) -> Dict[str, Any]:
    """
    Get a specific transcription by ID
    """
    file_path = os.path.join(transcriptions_dir, f"{transcription_id}.md")
    
    if not os.path.exists(file_path):
        return JSONResponse(
            status_code=404,
            content={"status": "error", "message": "Transcription not found"}
        )
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        return {
            "status": "success",
            "transcription_id": transcription_id,
            "content": content
        }
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to read transcription: {str(e)}"
            }
        )

# If the script is run directly, use this as a test
if __name__ == "__main__":
    print("This module provides video analysis routes for FastAPI")
