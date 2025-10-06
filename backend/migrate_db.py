import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text

def migrate():
    """Add missing columns to existing database tables"""
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE pages ADD COLUMN IF NOT EXISTS share_token VARCHAR UNIQUE"))
            conn.execute(text("ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE"))
            conn.commit()
        logging.info(" Database migration completed successfully!")
        logging.info("   - Added 'share_token' column to pages table")
        logging.info("   - Added 'is_public' column to pages table")
    except Exception as e:
        logging.error(f" Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()