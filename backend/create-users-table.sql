-- Create users table manually with gen_random_uuid() for Azure PostgreSQL
-- Run: PGPASSWORD=Newnalam26 psql -h otec.postgres.database.azure.com -U clouduser -d otec_db -f create-users-table.sql

-- Drop table if exists (for testing)
DROP TABLE IF EXISTS "users" CASCADE;

-- Create users table with gen_random_uuid() instead of uuid_generate_v4()
CREATE TABLE "users" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "email" character varying NOT NULL,
    "password" character varying NOT NULL,
    "firstName" character varying NOT NULL,
    "lastName" character varying NOT NULL,
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "UQ_users_email" UNIQUE ("email"),
    CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
);

-- Verify table creation
SELECT * FROM "users";

