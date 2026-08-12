export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface CustomerFollowUpNote {
  id: string;
  note: string;
  followUpDate?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetail extends Customer {
  followUpNotes: CustomerFollowUpNote[];
  salesChallans: Array<{
    id: string;
    challanNumber: string;
    status: string;
    totalQuantity: number;
    createdDate: string;
  }>;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: string;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdBy: string;
  createdAt: string;
  salesChallanId?: string | null;
  salesChallan?: {
    id: string;
    challanNumber: string;
    status: string;
  } | null;
}
