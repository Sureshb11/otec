export const TOOL_CATEGORY_SIZES: Record<string, string[]> = {
    "CRT": ["9.625", "10.75", "13.375", "13.625", "18.625", "7.75", "7.625"],
    "REAMERS": ["16", "12.25", "8.5", "6", "6.125", "12 1/4*13 1/2", "8 1/2*9 7/8"],
    "Power Tong": ["18.625", "13.625", "10.75", "9.625", "13.375", "4.5", "3.5", "2.875"],
    "Anti Stick Slip": ["8.25", "6.75"],
    "Scrapper": ["13.625", "13.375", "10.75", "9.625", "6.125", "7.75", "7.625", "7", "5.5", "5", "4.5", "6.5", "4.75"],
    "Jam Unit": ["9.625", "10.75", "13.375", "13.625", "18.625", "7.75", "7.625", "4.5", "3.5"],
    "Filup Tool": ["13.375", "13.625", "10.75", "9.625", "7.75", "7.625"]
};

export const getToolCategorySizes = (toolName: string): string[] | null => {
    if (!toolName) return null;
    const nameLower = toolName.toLowerCase();

    for (const [category, sizes] of Object.entries(TOOL_CATEGORY_SIZES)) {
        // Exact match or partial match based on typical naming conventions (e.g. "CRT 001")
        if (nameLower.includes(category.toLowerCase())) {
            return sizes;
        }
    }

    // Handle specific acronyms like 'PT' for Power Tong, etc.
    if (nameLower.startsWith('pt ') || nameLower.startsWith('power tong')) {
        return TOOL_CATEGORY_SIZES["Power Tong"];
    }

    return null;
};
