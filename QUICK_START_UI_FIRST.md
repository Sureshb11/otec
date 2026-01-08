# Quick Start: UI-First Development

## Enable Mock API (5 seconds)

1. Create `.env` file in `frontend/` directory:
```bash
cd frontend
echo "VITE_USE_MOCK_API=true" > .env
```

2. Start frontend:
```bash
npm run dev
```

That's it! You can now build UI without backend.

## How It Works

1. **Mock API is enabled** → UI uses mock data
2. **Build your UI** → Test with mock data
3. **Define API contracts** → Document in `API_CONTRACTS.md`
4. **Implement backend** → Match the contracts
5. **Switch to real API** → Change `VITE_USE_MOCK_API=false`

## Example: Adding a New Feature

### 1. Add Mock Data
```typescript
// frontend/src/api/mockData.ts
export const mockProducts = [
  { id: '1', name: 'Product 1', price: 100 },
];
```

### 2. Add Mock API
```typescript
// frontend/src/api/mockApi.ts
products: {
  getAll: async () => {
    await delay(500);
    return [...mockProducts];
  },
}
```

### 3. Add to API Client
```typescript
// frontend/src/api/apiClient.ts
products: {
  getAll: async () => {
    if (API_CONFIG.USE_MOCK_API) {
      return mockApi.products.getAll();
    }
    const response = await realApi.get('/products');
    return response.data;
  },
}
```

### 4. Use in Component
```typescript
// frontend/src/pages/Products.tsx
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: () => apiClient.products.getAll(),
});
```

## Switching to Real API

When backend is ready:

1. Update `.env`:
```env
VITE_USE_MOCK_API=false
```

2. Restart frontend:
```bash
npm run dev
```

No code changes needed! 🎉

## Files to Know

- `frontend/src/api/apiClient.ts` - Unified API client
- `frontend/src/api/mockApi.ts` - Mock API implementation
- `frontend/src/api/mockData.ts` - Mock data
- `frontend/src/config/api.config.ts` - API configuration
- `API_CONTRACTS.md` - API specifications
- `UI_FIRST_GUIDE.md` - Detailed guide

## Need Help?

See [UI_FIRST_GUIDE.md](./UI_FIRST_GUIDE.md) for complete documentation.

