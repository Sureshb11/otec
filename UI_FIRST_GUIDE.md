# UI-First Development Guide

This guide explains how to build new features using the UI-first approach in the OTEC application.

## Overview

The UI-first approach allows us to:
1. Build and test UI components without waiting for backend
2. Define API contracts upfront
3. Switch between mock and real API seamlessly
4. Enable parallel development (frontend and backend teams)

## Architecture

```
Frontend
├── src/
│   ├── api/
│   │   ├── apiClient.ts      # Unified API client (switches mock/real)
│   │   ├── mockApi.ts        # Mock API implementation
│   │   ├── mockData.ts       # Mock data
│   │   └── axios.ts          # Real API client
│   ├── config/
│   │   └── api.config.ts     # API configuration
│   └── pages/                # UI components
```

## How to Use

### 1. Enable Mock API

**Option A: Environment Variable**
Create `.env` file in `frontend/`:
```env
VITE_USE_MOCK_API=true
```

**Option B: Code Configuration**
Edit `frontend/src/config/api.config.ts`:
```typescript
export const API_CONFIG = {
  USE_MOCK_API: true, // Change to false for real API
  BASE_URL: '/api',
};
```

### 2. Building New Features

#### Step 1: Define API Contract
Document the API contract in `API_CONTRACTS.md`:
- Endpoint URL
- Request/Response structure
- Error handling

#### Step 2: Add Mock Data
Add mock data to `frontend/src/api/mockData.ts`:
```typescript
export const mockNewFeature: NewFeatureType[] = [
  {
    id: '1',
    name: 'Example',
    // ... other fields
  },
];
```

#### Step 3: Implement Mock API
Add mock API methods to `frontend/src/api/mockApi.ts`:
```typescript
export const mockApi = {
  // ... existing methods
  newFeature: {
    getAll: async (): Promise<NewFeatureType[]> => {
      await delay(500);
      return [...mockNewFeature];
    },
    create: async (data: Partial<NewFeatureType>): Promise<NewFeatureType> => {
      await delay(500);
      const newItem = { id: String(mockNewFeature.length + 1), ...data };
      mockNewFeature.push(newItem);
      return newItem;
    },
  },
};
```

#### Step 4: Add to Unified API Client
Add methods to `frontend/src/api/apiClient.ts`:
```typescript
export const apiClient = {
  // ... existing methods
  newFeature: {
    getAll: async () => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.newFeature.getAll();
      }
      const response = await realApi.get('/new-feature');
      return response.data;
    },
    create: async (data: any) => {
      if (API_CONFIG.USE_MOCK_API) {
        return mockApi.newFeature.create(data);
      }
      const response = await realApi.post('/new-feature', data);
      return response.data;
    },
  },
};
```

#### Step 5: Build UI Components
Use `apiClient` in your React components:
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';

const NewFeaturePage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['newFeature'],
    queryFn: () => apiClient.newFeature.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiClient.newFeature.create(data),
    onSuccess: () => {
      // Handle success
    },
  });

  // ... render UI
};
```

### 3. Switching to Real API

When backend is ready:

1. **Update Environment Variable**
   ```env
   VITE_USE_MOCK_API=false
   ```

2. **Verify API Endpoints**
   - Ensure backend implements all endpoints from `API_CONTRACTS.md`
   - Test endpoints match the contract exactly

3. **Test Integration**
   - UI should work seamlessly with real API
   - No code changes needed in components

## Best Practices

### 1. Always Define Contracts First
- Document API contracts before building UI
- Share contracts with backend team
- Update contracts if requirements change

### 2. Use TypeScript Types
- Define types for all data structures
- Use types in both mock and real API
- Ensure type safety

### 3. Simulate Real Behavior
- Add delays to mock API (simulate network latency)
- Handle errors in mock API
- Return realistic data structures

### 4. Keep Mock Data Realistic
- Use realistic data values
- Include edge cases (empty arrays, null values)
- Match real API response structure

### 5. Test Both Modes
- Test UI with mock API
- Test UI with real API
- Ensure both work identically

## Example: Adding a New Feature

Let's say we want to add a "Projects" feature:

1. **Define Contract** (`API_CONTRACTS.md`):
   ```markdown
   ## Projects API
   ### GET /projects
   Returns list of projects
   ```

2. **Add Mock Data** (`mockData.ts`):
   ```typescript
   export interface MockProject {
     id: string;
     name: string;
     description: string;
   }
   
   export const mockProjects: MockProject[] = [
     { id: '1', name: 'Project 1', description: '...' },
   ];
   ```

3. **Add Mock API** (`mockApi.ts`):
   ```typescript
   projects: {
     getAll: async () => {
       await delay(500);
       return [...mockProjects];
     },
   }
   ```

4. **Add to Client** (`apiClient.ts`):
   ```typescript
   projects: {
     getAll: async () => {
       if (API_CONFIG.USE_MOCK_API) {
         return mockApi.projects.getAll();
       }
       const response = await realApi.get('/projects');
       return response.data;
     },
   }
   ```

5. **Build UI** (`pages/Projects.tsx`):
   ```typescript
   const Projects = () => {
     const { data } = useQuery({
       queryKey: ['projects'],
       queryFn: () => apiClient.projects.getAll(),
     });
     // ... render
   };
   ```

## Troubleshooting

### Mock API not working?
- Check `VITE_USE_MOCK_API` is set to `true`
- Verify mock data exists
- Check browser console for errors

### Real API not working?
- Check backend is running
- Verify API endpoints match contracts
- Check CORS settings
- Verify authentication tokens

### Types don't match?
- Ensure mock data types match real API types
- Update TypeScript interfaces
- Check API contract documentation

## Next Steps

1. Build new features using this approach
2. Share API contracts with backend team
3. Implement backend to match contracts
4. Switch to real API when ready
5. Remove mock API code (optional, can keep for testing)

