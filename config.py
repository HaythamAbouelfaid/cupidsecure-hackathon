import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-please-change-in-prod'
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    DEBUG = True
    # Add other configuration variables here
