# Role-Based Access Control (RBAC) Setup Guide

## Overview

The application now supports role-based access control with three roles:
- **admin**: Full access to all screens and features
- **user**: Limited access to basic screens (Dashboard, Settings)
- **manager**: Elevated permissions (can be customized)

## Database Setup

The roles tables have been created. You can verify by checking:
- `roles` table - Contains the role definitions
- `user_roles` table - Junction table linking users to roles

## Assigning Admin Role to a User

To make a user an admin, you have two options:

### Option 1: Using SQL Script

1. Edit `backend/assign-admin-role.sql`
2. Change the email on line 6: `user_email text := 'your-email@example.com';`
3. Run the script:
   ```bash
   cd backend
   PGPASSWORD=Newnalam26 psql -h otec.postgres.database.azure.com -U clouduser -d otec_db -f assign-admin-role.sql
   ```

### Option 2: Direct SQL Command

```bash
PGPASSWORD=Newnalam26 psql -h otec.postgres.database.azure.com -U clouduser -d otec_db
```

Then run:
```sql
-- Get the user ID and admin role ID
SELECT u.id as user_id, r.id as role_id 
FROM users u, roles r 
WHERE u.email = 'your-email@example.com' AND r.name = 'admin';

-- Assign admin role (replace with actual IDs from above)
INSERT INTO user_roles ("userId", "roleId") 
VALUES ('user-id-here', 'admin-role-id-here')
ON CONFLICT DO NOTHING;
```

## Access Control

### Backend (API)
- `/users` - Admin only (GET all users)
- `/roles` - Admin only
- Other endpoints can be protected using `@Roles('admin')` decorator

### Frontend (Pages)
- `/dashboard` - All authenticated users
- `/admin` - Admin only
- `/users` - Admin only (User Management)
- `/settings` - All authenticated users

## Testing

1. **Create a regular user** - Register normally (gets 'user' role by default)
2. **Assign admin role** - Use the SQL script above
3. **Login as admin** - Should see Admin Panel and Users links in navigation
4. **Login as regular user** - Should only see Dashboard and Settings

## Role Structure

```
users (table)
  ├── id
  ├── email
  ├── password
  └── ...other fields

roles (table)
  ├── id
  ├── name (enum: admin, user, manager)
  └── description

user_roles (junction table)
  ├── userId (FK to users)
  └── roleId (FK to roles)
```

## Adding New Roles

To add a new role:
1. Add it to the `RoleType` enum in `backend/src/roles/role.entity.ts`
2. Update the database enum type
3. Insert the role into the `roles` table
4. Update the frontend to handle the new role

