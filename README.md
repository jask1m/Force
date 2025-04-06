# Fillosophy

## Overview

Force is a video processing and transcription platform designed to help users automatically extract and manage transcripts from video recordings. It combines advanced AI capabilities with a user-friendly interface to provide accurate video transcriptions that can be used for various applications such as visa applications, documentation, and content creation.

### Prerequisites

- Python 3.9+
- Node.js 18+ and npm
- Google Gemini API key
- (Optional) OpenAI API key
- (Optional) Llama Cloud API key

### Backend Setup

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/force.git
   cd force
   ```

2. Set up Python virtual environment

   ```bash
   cd backend
   python -m venv venv

   # On Windows
   .\venv\Scripts\activate

   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies

   ```bash
   pip install -r requirements.txt
   ```

4. Create environment variables file

   ```bash
   cp .env.example .env
   ```

5. Add your API keys to the `.env` file

   ```bash
   GEMINI_API_KEY="your_gemini_api_key"
   OPENAI_API_KEY="your_openai_api_key" # Optional
   LLAMA_CLOUD_API_KEY="your_llama_api_key" # Optional
   LLAMA_CLOUD_BASE_URL="your_llama_base_url" # Optional
   GOOGLE_API_KEY="your_google_api_key" # Optional
   ```

6. Run the backend server
   ```bash
   python run.py
   ```
   The backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory

   ```bash
   cd ../frontend
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create environment variables file

   ```bash
   cp .env.example .env
   ```

4. Run the development server
   ```bash
   npm run dev
   ```
   The frontend will be available at http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Use the dashboard to upload video recordings
3. After processing, view and manage transcriptions
4. Process transcriptions with document templates as needed

## Project Structure

- `/backend` - FastAPI backend server and AI integration
  - `/data` - Storage for transcriptions and processed files
  - `/videos` - Storage for uploaded video files
- `/frontend` - Next.js React frontend application
  - `/src` - Source code for the frontend
