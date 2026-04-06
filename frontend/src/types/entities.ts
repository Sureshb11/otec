// Business Entity Types for OTEC Application

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Location {
    id: string;
    name: string;
    country: string;
    region?: string;
    coordinates?: string;
    description?: string;
    customerId?: string;
    customer?: Customer;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type RigType = 'TRS' | 'DHT';
export type RigStatus = 'active' | 'inactive' | 'maintenance';

export interface Rig {
    id: string;
    name: string;
    type: RigType;
    status: RigStatus;
    description?: string;
    locationId?: string;
    location?: Location;
    customerId?: string;
    customer?: Customer;
    createdAt: string;
    updatedAt: string;
}

export type ToolType = 'TRS' | 'DHT';
export type ToolStatus = 'available' | 'onsite' | 'maintenance';

export interface Tool {
    id: string;
    name: string;
    type: ToolType;
    serialNumber: string;
    size?: string;
    status: ToolStatus;
    description?: string;
    operationalHours: number;
    rigId?: string;
    rig?: Rig;
    createdAt: string;
    updatedAt: string;
}

export type ToolInstanceStatus = 'running' | 'stopped' | 'completed';

export interface ToolInstance {
    id: string;
    toolId: string;
    tool?: Tool;
    rigId: string;
    rig?: Rig;
    startTime: string;
    endTime?: string;
    runningHours: number;
    calculatedRunningHours?: number;
    depth?: number;
    status: ToolInstanceStatus;
    createdAt: string;
    updatedAt: string;
}

export type OrderStatus = 'draft' | 'booked' | 'active' | 'job_done' | 'returned' | 'cancelled';

export interface Order {
    id: string;
    orderNumber: string;
    customerId: string;
    customer?: Customer;
    locationId?: string;
    location?: Location;
    rigId?: string;
    rig?: Rig;
    status: OrderStatus;
    startDate: string;
    endDate?: string;
    activatedAt?: string;
    returnedAt?: string;
    totalAmount?: number;
    notes?: string;
    items?: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    id: string;
    orderId: string;
    order?: Order;
    toolId: string;
    tool?: Tool;
    quantity: number;
    duration?: number;
    dailyRate?: number;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryItem {
    id: string;
    itemName: string;
    category: string;
    quantity: number;
    unit?: string;
    minStock: number;
    location?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

// Dashboard Types
export interface DashboardSummary {
    tools: { active: number; available: number; maintenance: number; total: number };
    rigs: { active: number; total: number };
    orders: { active: number };
    customers: { total: number };
}
