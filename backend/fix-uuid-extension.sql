-- Run this SQL script to enable gen_random_uuid() function
-- This is needed for Azure PostgreSQL
-- Connect to your database and run: psql -h otec.postgres.database.azure.com -U clouduser -d otec_db -f fix-uuid-extension.sql

-- For PostgreSQL 13+, gen_random_uuid() is available in pgcrypto extension
-- But Azure PostgreSQL might have it enabled by default
-- If not, you may need to enable pgcrypto extension (requires admin privileges)

-- Check if gen_random_uuid() is available
SELECT gen_random_uuid();

-- If the above works, you're good to go!
-- If it fails, you may need to enable pgcrypto extension:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

