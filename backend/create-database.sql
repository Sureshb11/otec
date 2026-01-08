-- SQL script to create the database on Azure PostgreSQL
-- Run this using: psql -h otec.postgres.database.azure.com -U clouduser -d postgres -f create-database.sql

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE otec_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'otec_db')\gexec

-- Connect to the new database
\c otec_db

-- Grant privileges (if needed)
GRANT ALL PRIVILEGES ON DATABASE otec_db TO clouduser;

