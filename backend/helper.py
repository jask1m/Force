import os
from dotenv import load_dotenv, find_dotenv

def load_env():
    _ = load_dotenv(find_dotenv())

def get_openai_api_key():
    load_env()
    openai_api_key = os.getenv("OPENAI_API_KEY")
    return openai_api_key

def get_llama_cloud_api_key():
    load_env()
    llama_cloud_api_key = os.getenv("LLAMA_CLOUD_API_KEY")
    return llama_cloud_api_key

def get_google_api_key():
    load_env()
    google_api_key = os.getenv("GOOGLE_API_KEY")
    return google_api_key