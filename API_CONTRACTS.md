# API Contracts Documentation

This document defines the API contracts for the OTEC application. These contracts serve as the specification for backend implementation when building UI-first.

## Base URL
- Development: `http://localhost:3000`
- Production: TBD

## Authentication
All API endpoints (except `/auth/login`) require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Users API

### GET /users
Get all users (Admin only)

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "isActive": boolean,
    "roles": [
      {
        "id": "uuid",
        "name": "string"
      }
    ],
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
]
```

### GET /users/:id
Get user by ID

**Response:**
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "isActive": boolean,
  "roles": [...]
}
```

### POST /users
Create new user (Admin only)

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "roleIds": ["uuid"] // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "isActive": boolean,
  "roles": [...]
}
```

### PATCH /users/:id
Update user

**Request Body:**
```json
{
  "firstName": "string", // optional
  "lastName": "string",   // optional
  "email": "string",      // optional
  "password": "string",   // optional
  "isActive": boolean     // optional
}
```

### DELETE /users/:id
Delete user (Admin only)

**Response:** 204 No Content

### PUT /users/:id/roles
Update user roles (Admin only)

**Request Body:**
```json
{
  "roleIds": ["uuid", "uuid"]
}
```

---

## Roles API

### GET /roles
Get all roles (Admin only)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "description": "string"
  }
]
```

### GET /roles/:id
Get role by ID

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string"
}
```

### POST /roles
Create new role (Admin only)

**Request Body:**
```json
{
  "name": "string", // enum: admin, user, manager, employee, driver, vendor
  "description": "string" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string"
}
```

### PATCH /roles/:id
Update role (Admin only)

**Request Body:**
```json
{
  "description": "string" // optional
}
```

### DELETE /roles/:id
Delete role (Admin only)

**Response:** 204 No Content

---

## Permissions API

### GET /permissions/role/:roleId
Get all permissions for a role (Admin only)

**Response:**
```json
[
  {
    "id": "uuid",
    "moduleName": "string",
    "feature": "string",
    "canView": boolean,
    "canAdd": boolean,
    "canEdit": boolean,
    "canDelete": boolean,
    "roleId": "uuid"
  }
]
```

### POST /permissions/role/:roleId/defaults
Create default permissions for a role (Admin only)

**Response:**
```json
[
  {
    "id": "uuid",
    "moduleName": "string",
    "feature": "string",
    "canView": boolean,
    "canAdd": boolean,
    "canEdit": boolean,
    "canDelete": boolean,
    "roleId": "uuid"
  }
]
```

### PUT /permissions/role/:roleId/bulk
Bulk update permissions for a role (Admin only)

**Request Body:**
```json
[
  {
    "id": "uuid", // optional for new permissions
    "moduleName": "string",
    "feature": "string",
    "canView": boolean,
    "canAdd": boolean,
    "canEdit": boolean,
    "canDelete": boolean
  }
]
```

**Response:**
```json
[
  {
    "id": "uuid",
    "moduleName": "string",
    "feature": "string",
    "canView": boolean,
    "canAdd": boolean,
    "canEdit": boolean,
    "canDelete": boolean,
    "roleId": "uuid"
  }
]
```

---

## Authentication API

### POST /auth/login
Login user

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "jwt token",
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "roles": ["string"]
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Notes

1. All UUIDs are in standard UUID v4 format
2. All dates are in ISO 8601 format
3. All string fields should be validated on the backend
4. Pagination may be added later for list endpoints
5. Filtering and sorting may be added later

