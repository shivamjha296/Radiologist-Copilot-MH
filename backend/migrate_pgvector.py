"""
Migration script to add pgvector support to existing database
Converts JSON to JSONB and adds vector embedding column

Run this AFTER manually enabling the vector extension in Render PostgreSQL:
    python backend/migrate_pgvector.py
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate_pgvector():
    """Execute database migration for pgvector support"""
    
    # Get database URL and fix Render format
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ ERROR: DATABASE_URL not found in environment variables")
        sys.exit(1)
    
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    print(f"🔗 Connecting to database...")
    
    # Create engine with SSL for Render
    engine = create_engine(
        DATABASE_URL,
        echo=True,  # Show SQL commands
        connect_args={
            "sslmode": "require",
            "connect_timeout": 10,
        } if "render.com" in DATABASE_URL else {}
    )
    
    try:
        with engine.begin() as conn:
            print("\n📋 Starting pgvector migration...\n")
            
            # Step 1: Verify vector extension exists
            print("✅ Step 1: Verifying pgvector extension...")
            result = conn.execute(text(
                "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector');"
            ))
            has_vector = result.scalar()
            
            if not has_vector:
                print("❌ ERROR: pgvector extension not enabled!")
                print("   Please run in PostgreSQL: CREATE EXTENSION vector;")
                sys.exit(1)
            
            print("   ✓ pgvector extension confirmed\n")
            
            # Step 2: Check if reports table exists
            print("✅ Step 2: Checking reports table...")
            result = conn.execute(text(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'reports'
                );
                """
            ))
            reports_exists = result.scalar()
            
            if not reports_exists:
                print("   ℹ️  Reports table doesn't exist yet - will be created by init_db()")
                return
            
            print("   ✓ Reports table found\n")
            
            # Step 3: Check current column types
            print("✅ Step 3: Analyzing current schema...")
            result = conn.execute(text(
                """
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'reports' 
                AND column_name IN ('ner_tags', 'embedding');
                """
            ))
            columns = {row[0]: row[1] for row in result}
            print(f"   Current columns: {columns}\n")
            
            # Step 4: Migrate ner_tags from JSON to JSONB
            if 'ner_tags' in columns:
                if columns['ner_tags'] == 'json':
                    print("✅ Step 4: Converting ner_tags JSON → JSONB...")
                    conn.execute(text(
                        "ALTER TABLE reports ALTER COLUMN ner_tags TYPE JSONB USING ner_tags::jsonb;"
                    ))
                    print("   ✓ ner_tags converted to JSONB\n")
                elif columns['ner_tags'] == 'jsonb':
                    print("✅ Step 4: ner_tags already JSONB - skipping\n")
                else:
                    print(f"⚠️  Step 4: Unexpected ner_tags type: {columns['ner_tags']}\n")
            else:
                print("✅ Step 4: Adding ner_tags JSONB column...")
                conn.execute(text(
                    "ALTER TABLE reports ADD COLUMN ner_tags JSONB;"
                ))
                print("   ✓ ner_tags column added\n")
            
            # Step 5: Add embedding vector column if missing
            if 'embedding' not in columns:
                print("✅ Step 5: Adding embedding vector(1536) column...")
                conn.execute(text(
                    "ALTER TABLE reports ADD COLUMN embedding vector(1536);"
                ))
                print("   ✓ embedding column added\n")
            else:
                print(f"✅ Step 5: embedding column already exists ({columns['embedding']})\n")
            
            # Step 6: Create vector index for similarity search
            print("✅ Step 6: Creating vector similarity index...")
            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_reports_embedding ON reports USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);"
            ))
            print("   ✓ IVFFlat index created (cosine similarity)\n")
            
            # Step 7: Create GIN index for JSONB queries
            print("✅ Step 7: Creating JSONB index...")
            conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_reports_ner_tags ON reports USING gin (ner_tags);"
            ))
            print("   ✓ GIN index created for ner_tags\n")
            
        print("=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\nDatabase is now ready for:")
        print("  • 1536-dimensional vector embeddings (OpenAI/BiomedCLIP)")
        print("  • Fast semantic similarity search (IVFFlat index)")
        print("  • Efficient JSONB queries for NER tags (GIN index)")
        print("\nNext step: Restart your backend server")
        
    except Exception as e:
        print(f"\n❌ MIGRATION FAILED: {e}")
        sys.exit(1)
    
    finally:
        engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print("  PGVECTOR MIGRATION SCRIPT")
    print("=" * 60)
    print("\nThis script will:")
    print("  1. Verify pgvector extension is enabled")
    print("  2. Convert ner_tags from JSON to JSONB")
    print("  3. Add embedding vector(1536) column")
    print("  4. Create performance indexes")
    print("\n⚠️  WARNING: This will modify the database schema!")
    print("   Ensure you have a backup before proceeding.\n")
    
    response = input("Continue with migration? (yes/no): ").strip().lower()
    
    if response == 'yes':
        migrate_pgvector()
    else:
        print("\n❌ Migration cancelled by user")
        sys.exit(0)
