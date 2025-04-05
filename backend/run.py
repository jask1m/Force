import fastapi
import uvicorn
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from gemini import router as gemini_router

# Get base directory path
current_dir = os.path.dirname(os.path.abspath(__file__))

app = fastapi.FastAPI(title="Video Analysis API")

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the Gemini router
app.include_router(gemini_router, prefix="/gemini", tags=["Gemini"])

# Serve test.html for testing
@app.get("/test", response_class=FileResponse)
async def get_test_page():
    test_html_path = os.path.join(current_dir, "test.html")
    return FileResponse(test_html_path)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Video Analysis API is running. Visit /test for the test interface."}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)

