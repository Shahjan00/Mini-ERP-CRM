export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followupDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    followups: number;
    challans: number;
  };
  followups?: FollowupNote[];
  challans?: Challan[];
}

export interface FollowupNote {
  id: string;
  customerId: string;
  note: string;
  followupDate?: string | null;
  createdById: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  createdAt: string;
  updatedAt: string;
  isLowStock?: boolean;
  movements?: StockMovement[];
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    category?: string;
  };
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  timestamp: string;
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id?: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotal: number;
  product?: {
    id: string;
    currentStock: number;
    minStockAlert: number;
    location: string;
  };
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerNameSnapshot: string;
  customerEmailSnapshot: string;
  customerMobileSnapshot: string;
  totalQuantity: number;
  grandTotal: number;
  status: ChallanStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  createdBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  items: ChallanItem[];
}

export interface DashboardStats {
  kpis: {
    customers: {
      total: number;
      leads: number;
      active: number;
    };
    inventory: {
      totalProducts: number;
      lowStockAlerts: number;
      outOfStock: number;
    };
    challans: {
      total: number;
      confirmedCount: number;
      totalRevenue: number;
    };
  };
  feeds: {
    recentChallans: Challan[];
    recentMovements: StockMovement[];
  };
}
