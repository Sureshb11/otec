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

/**
 * Parses a tool's `size` field (as imported from the master xlsx) into an
 * array of individual casing specs. The source uses commas to separate
 * multiple compatible sizes, e.g.:
 *   "9 5/8\" 40-53.5 PPF, 10 3/4\" 60.7-73.2 PPF, 13 3/8\" 61-72 PPF"
 * Returns null if no usable sizes are present.
 */
export const parseToolSizes = (sizeField: string | null | undefined): string[] | null => {
    if (!sizeField) return null;
    // Accept commas, line breaks, or semicolons as boundaries. The master
    // sheet uses commas inside cells and newlines between groups, and the
    // importer normalises one to the other — be permissive on read.
    const parts = sizeField
        .split(/[,;\r\n]+/)
        .map((s) => s.replace(/\s+/g, ' ').trim())
        .filter((s) => s.length > 0);
    // De-dup while preserving order
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const p of parts) {
        const k = p.toLowerCase();
        if (!seen.has(k)) {
            seen.add(k);
            unique.push(p);
        }
    }
    return unique.length > 0 ? unique : null;
};

/**
 * Resolve the size options to show for a tool. Prefers the tool's own size
 * field (imported from the master sheet) and falls back to the category
 * defaults for legacy tools that have no size data.
 */
export const getSizeOptionsForTool = (tool: {
    name?: string | null;
    size?: string | null;
}): string[] | null => {
    return parseToolSizes(tool.size ?? null) ?? getToolCategorySizes(tool.name ?? '');
};
