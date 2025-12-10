-- ==========================================
-- MIMICARE - PostgreSQL Initialization
-- ==========================================
-- Minimal: Extensions only (Prisma handles tables)

-- Required extensions
CREATE EXTENSION IF NOT EXISTS vector;       -- AI/ML embeddings
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- UUID generation
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- Full-text search
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- Encryption

-- Use UTC (best practice)
ALTER DATABASE mimicare SET timezone = 'UTC';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '  ✓ MIMICARE Database Initialized';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'User: %', current_user;
    RAISE NOTICE 'Timezone: UTC';
    RAISE NOTICE '';
    RAISE NOTICE 'Extensions Enabled:';
    RAISE NOTICE '  ✓ pgvector v% (AI/ML embeddings)', (SELECT extversion FROM pg_extension WHERE extname = 'vector');
    RAISE NOTICE '  ✓ uuid-ossp v% (UUID generation)', (SELECT extversion FROM pg_extension WHERE extname = 'uuid-ossp');
    RAISE NOTICE '  ✓ pg_trgm v% (Full-text search)', (SELECT extversion FROM pg_extension WHERE extname = 'pg_trgm');
    RAISE NOTICE '  ✓ pgcrypto v% (Encryption)', (SELECT extversion FROM pg_extension WHERE extname = 'pgcrypto');
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for Prisma migrations!';
    RAISE NOTICE 'Run: yarn db:migrate';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;
