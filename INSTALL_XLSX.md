# Installing xlsx Library for Excel Import

## Quick Fix

To resolve the "Failed to resolve import 'xlsx'" error, install the xlsx library:

```bash
cd frontend
npm install xlsx
```

Then restart your development server:

```bash
npm run dev
```

## Alternative: Use CSV Instead

If you prefer not to install xlsx, you can:

1. Open your Excel file in Excel/Google Sheets
2. Save it as CSV format (File → Save As → CSV)
3. Import the CSV file directly (no installation needed)

The CSV import works immediately without any additional dependencies.

## What's Already Done

✅ xlsx has been added to `package.json` dependencies  
✅ Import functionality is implemented  
✅ CSV import works without xlsx  
✅ Excel import will work after installing xlsx  

## After Installation

Once xlsx is installed, you can:
- Import Excel files (.xlsx, .xls) directly
- Import CSV files (.csv)
- Both formats support: Name, Group, Size, Type, Quantity columns

