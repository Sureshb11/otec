# Logo Placement

## How to Add Your OTEC Logo

1. Place your logo image file in this `public` folder
2. Name it `logo.png` (or update the path in all page files)
3. The logo will automatically appear in the sidebar above the Dashboard menu

## Supported Formats
- PNG (recommended)
- JPG/JPEG
- SVG

## Current Logo Path
The logo is referenced as `/logo.png` in all page components. If you use a different filename, update the `src` attribute in:
- `src/pages/Dashboard.tsx`
- `src/pages/Orders.tsx`
- `src/pages/Customers.tsx`
- `src/pages/Locations.tsx`
- `src/pages/Rigs.tsx`
- `src/pages/Inventory.tsx`
- `src/pages/CustomerDetails.tsx`
- `src/pages/OrderDetails.tsx`

## Logo Specifications
- Recommended size: 200-250px width
- Format: PNG with transparent background (preferred)
- The logo will automatically scale to fit the sidebar width

