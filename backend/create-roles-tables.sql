-- Create roles and user_roles tables for RBAC
-- Run: PGPASSWORD=Newnalam26 psql -h otec.postgres.database.azure.com -U clouduser -d otec_db -f create-roles-tables.sql

-- Create enum type for roles
DO $$ BEGIN
    CREATE TYPE roletype AS ENUM ('admin', 'user', 'manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create roles table
CREATE TABLE IF NOT EXISTS "roles" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" roletype NOT NULL,
    "description" character varying,
    CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
    CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS "user_roles" (
    "userId" uuid NOT NULL,
    "roleId" uuid NOT NULL,
    CONSTRAINT "PK_user_roles" PRIMARY KEY ("userId", "roleId"),
    CONSTRAINT "FK_user_roles_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
    CONSTRAINT "FK_user_roles_roleId" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE
);

-- Insert default roles
INSERT INTO "roles" ("name", "description") 
VALUES 
    ('admin', 'Administrator with full access'),
    ('user', 'Regular user with limited access'),
    ('manager', 'Manager with elevated permissions')
ON CONFLICT ("name") DO NOTHING;

-- Add a default 'user' role to existing users (if any)
DO $$
DECLARE
    user_role_id uuid;
BEGIN
    SELECT "id" INTO user_role_id FROM "roles" WHERE "name" = 'user';
    IF user_role_id IS NOT NULL THEN
        INSERT INTO "user_roles" ("userId", "roleId")
        SELECT u."id", user_role_id
        FROM "users" u
        WHERE NOT EXISTS (
            SELECT 1 FROM "user_roles" ur 
            WHERE ur."userId" = u."id" AND ur."roleId" = user_role_id
        );
    END IF;
END $$;

-- Verify tables
SELECT * FROM "roles";
SELECT COUNT(*) as total_users_with_roles FROM "user_roles";

