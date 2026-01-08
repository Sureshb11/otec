# Mock Login Credentials

When using mock API (`VITE_USE_MOCK_API=true`), you can login with these test accounts:

## Available Test Accounts

### Admin Account
- **Email:** `admin@otec.com`
- **Password:** `admin123`
- **Roles:** admin
- **Access:** Full access to all features

### Manager Account
- **Email:** `manager@otec.com`
- **Password:** `manager123`
- **Roles:** manager
- **Access:** Manager-level access

### Employee Account
- **Email:** `employee@otec.com`
- **Password:** `employee123`
- **Roles:** employee
- **Access:** Employee-level access

### Regular User Account
- **Email:** `user@otec.com`
- **Password:** `user123`
- **Roles:** user
- **Access:** Basic user access

## How to Use

1. **Enable Mock API:**
   ```bash
   # In frontend/.env
   VITE_USE_MOCK_API=true
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login with any test account above**

## Notes

- These credentials only work when mock API is enabled
- Passwords are plain text in mock mode (for testing only)
- Real API will use actual authentication
- Mock tokens are simple strings (not real JWT)

## Adding More Test Accounts

Edit `frontend/src/api/mockData.ts`:

```typescript
export const mockLoginUsers: Record<string, MockLoginUser> = {
  // ... existing users
  'newuser@otec.com': {
    email: 'newuser@otec.com',
    password: 'password123',
    user: {
      id: '5',
      email: 'newuser@otec.com',
      firstName: 'New',
      lastName: 'User',
      roles: ['user'],
    },
  },
};
```

