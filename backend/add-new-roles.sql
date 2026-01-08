-- Add new roles: employee, driver, vendor
-- Run: PGPASSWORD=Newnalam26 psql -h otec.postgres.database.azure.com -U clouduser -d otec_db -f add-new-roles.sql

-- Add new enum values if they don't exist
DO $$ BEGIN
    -- Check if enum values exist, if not add them
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'employee' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'roletype')) THEN
        ALTER TYPE roletype ADD VALUE 'employee';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'driver' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'roletype')) THEN
        ALTER TYPE roletype ADD VALUE 'driver';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'vendor' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'roletype')) THEN
        ALTER TYPE roletype ADD VALUE 'vendor';
    END IF;
END $$;

-- Insert new roles if they don't exist
INSERT INTO "roles" ("name", "description") 
VALUES 
    ('employee', 'Employee with standard access'),
    ('driver', 'Driver with delivery/transport access'),
    ('vendor', 'Vendor with supplier access')
ON CONFLICT ("name") DO NOTHING;

-- Verify roles
SELECT * FROM "roles" ORDER BY "name";

