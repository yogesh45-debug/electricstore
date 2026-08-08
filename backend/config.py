import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'electrostore-session-secret-key-xyz')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configurations
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'electrostore-jwt-secret-key-abc')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # Token expires in 24 hours
