import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Get and format database URI
raw_db_url = os.getenv('DATABASE_URL')
if not raw_db_url:
    # Fallback to local SQLite to prevent crashing when DATABASE_URL is not yet provided
    db_uri = 'sqlite:///electrostore.db'
elif raw_db_url.startswith('mysql://') and not raw_db_url.startswith('mysql+pymysql://'):
    db_uri = raw_db_url.replace('mysql://', 'mysql+pymysql://', 1)
elif raw_db_url.startswith('postgres://'):
    db_uri = raw_db_url.replace('postgres://', 'postgresql://', 1)
else:
    db_uri = raw_db_url

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'electrostore-session-secret-key-xyz')
    SQLALCHEMY_DATABASE_URI = db_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configurations
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'electrostore-jwt-secret-key-abc')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # Token expires in 24 hours
