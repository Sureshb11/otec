-- Create permissions table
-- Run: PGPASSWORD=Newnalam26 psql -h otec.postgres.database.azure.com -U clouduser -d otec_db -f create-permissions-table.sql

CREATE TABLE IF NOT EXISTS "permissions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "moduleName" character varying NOT NULL,
    "feature" character varying NOT NULL,
    "canView" boolean NOT NULL DEFAULT false,
    "canAdd" boolean NOT NULL DEFAULT false,
    "canEdit" boolean NOT NULL DEFAULT false,
    "canDelete" boolean NOT NULL DEFAULT false,
    "roleId" uuid NOT NULL,
    CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id"),
    CONSTRAINT "FK_permissions_roleId" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "IDX_permissions_roleId" ON "permissions"("roleId");
CREATE INDEX IF NOT EXISTS "IDX_permissions_moduleName" ON "permissions"("moduleName");

-- Verify table creation
SELECT * FROM "permissions" LIMIT 1;

