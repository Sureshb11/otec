# Tools Import Guide

## Overview
The Inventory page now supports importing tools from Excel (.xlsx, .xls) or CSV (.csv) files with various types and sizes.

## Installation (For Excel Support)

To enable Excel file import, install the `xlsx` library:

```bash
cd frontend
npm install xlsx
```

Then restart your development server.

**Note:** If you prefer not to install xlsx, you can save your Excel file as CSV format and import it directly.

## File Format Requirements

### CSV Format
Your CSV file should have the following columns (in any order):

**Required Columns:**
- **Name** or **Tool** - Tool name (e.g., "CRT", "POWER TONG")
- **Group** or **Type** - Tool group: "TRS" or "DHT" (case-insensitive)

**Optional Columns:**
- **Size** - Tool size (e.g., "4 1/2\"", "5\"", "7\"")
- **Type** - Tool type (e.g., "Standard", "Heavy Duty")
- **Quantity** or **Qty** or **Available** - Available quantity (defaults to 10 if not provided)

### Example CSV Format:
```csv
Name,Group,Size,Type,Quantity
CRT,TRS,4 1/2",Standard,10
POWER TONG,TRS,5",Standard,15
REAMERS,DHT,7",Heavy Duty,8
```

### Excel Format (.xlsx, .xls)
The Excel file should follow the same column structure as CSV:
- First row: Headers (Name, Group, Size, Type, Quantity)
- Subsequent rows: Tool data

The system automatically detects columns by name (case-insensitive, partial match).

## How to Import Tools

1. Navigate to **Operations → Inventory**
2. Click the **"Import Tools"** button (green button with upload icon)
3. Select your Excel or CSV file
4. The system will:
   - Parse the file automatically
   - Detect required columns (Name, Group)
   - Import optional columns (Size, Type, Quantity)
   - Merge with existing tools (updates if exists, adds if new)
   - Show a success message with the number of tools imported

## Import Behavior

- **New Tools**: Added to the inventory
- **Existing Tools**: Updated with new data (based on tool ID)
- **Duplicate Detection**: Tools with the same name and group are considered duplicates
- **Default Values**: 
  - Group defaults to "TRS" if not specified
  - Quantity defaults to 10 if not specified
  - Size and Type are optional (can be empty)

## Adding Individual Tools

You can also add tools manually:
1. Click **"Add Tool"** button
2. Fill in the form:
   - Tool Name (required)
   - Group: TRS or DHT (required)
   - Size (optional)
   - Type (optional)
   - Available Quantity (default: 10)
3. Click **"Add Tool"**

## Features

- ✅ CSV file import (works immediately)
- ✅ Excel file import (.xlsx, .xls) - requires xlsx library
- ✅ Automatic column detection
- ✅ Flexible column names (partial matching)
- ✅ Size and Type fields support
- ✅ Merge with existing tools
- ✅ Update existing tools
- ✅ Display Size and Type in inventory table

