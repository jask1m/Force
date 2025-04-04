import fastapi
import uvicorn
from gemini import router as gemini_router

app = fastapi.FastAPI(title="Video Analysis API")

# Include the Gemini router
app.include_router(gemini_router, prefix="/gemini", tags=["Gemini"])

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Video Analysis API is running. Use /gemini/analyze-video to analyze videos."}

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)

