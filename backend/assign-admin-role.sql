-- Assign admin role to a user
-- Replace 'user-email@example.com' with the actual email of the user you want to make admin
-- Run: PGPASSWORD=Newnalam26 psql -h otec.postgres.database.azure.com -U clouduser -d otec_db -f assign-admin-role.sql

-- Update the email below to assign admin role
DO $$
DECLARE
    admin_role_id uuid;
    user_id_to_update uuid;
    user_email text := 'user-email@example.com'; -- CHANGE THIS EMAIL
BEGIN
    -- Get admin role ID
    SELECT "id" INTO admin_role_id FROM "roles" WHERE "name" = 'admin';
    
    -- Get user ID
    SELECT "id" INTO user_id_to_update FROM "users" WHERE "email" = user_email;
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Admin role not found';
    END IF;
    
    IF user_id_to_update IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Remove existing roles and assign admin role
    DELETE FROM "user_roles" WHERE "userId" = user_id_to_update;
    INSERT INTO "user_roles" ("userId", "roleId") VALUES (user_id_to_update, admin_role_id);
    
    RAISE NOTICE 'Admin role assigned to user: %', user_email;
END $$;

-- Verify the assignment
SELECT u."email", u."firstName", u."lastName", r."name" as role
FROM "users" u
JOIN "user_roles" ur ON u."id" = ur."userId"
JOIN "roles" r ON ur."roleId" = r."id"
WHERE r."name" = 'admin';

