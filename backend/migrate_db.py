"""
Database migration script to add share_token and is_public columns
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine
from sqlalchemy import text

def migrate():
    """Add missing columns to existing database tables"""
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE pages ADD COLUMN IF NOT EXISTS share_token VARCHAR UNIQUE"))
            conn.execute(text("ALTER TABLE pages ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE"))
            conn.commit()
        print(" Database migration completed successfully!")
        print("   - Added 'share_token' column to pages table")
        print("   - Added 'is_public' column to pages table")
    except Exception as e:
        print(f" Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()