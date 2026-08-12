import type {
  Customer,
  CustomerDetail,
  CustomerStatus,
  CustomerType,
  PaginatedResponse,
  Product,
  StockMovement,
  UserSession,
} from '../types/domain';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
const TOKEN_KEY = 'mini-erp-token';
const USER_KEY = 'mini-erp-user';

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const isAuthenticated = () => Boolean(getToken() && getStoredUser());

export const getStoredUser = (): UserSession | null => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as UserSession) : null;
};

export const setSession = (token: string, user: UserSession) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const createQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });

  const queryString = search.toString();
  return queryString ? `?${queryString}` : '';
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
    if (response.status === 401) {
      clearSession();
    }
    throw new ApiError(response.status, body.error ?? body.message ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(email: string, password: string) {
    return request<{ token: string; user: UserSession }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  listCustomers(params: {
    q?: string;
    status?: CustomerStatus | '';
    customerType?: CustomerType | '';
    page?: number;
    pageSize?: number;
  }) {
    return request<PaginatedResponse<Customer>>(`/customers${createQueryString(params)}`);
  },

  getCustomer(customerId: string) {
    return request<CustomerDetail>(`/customers/${customerId}`);
  },

  createCustomer(payload: Record<string, unknown>) {
    return request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCustomer(customerId: string, payload: Record<string, unknown>) {
    return request<Customer>(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  addCustomerFollowUp(customerId: string, payload: Record<string, unknown>) {
    return request(`/customers/${customerId}/follow-up-notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listProducts(params: {
    q?: string;
    lowStock?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    return request<PaginatedResponse<Product>>(`/products${createQueryString(params)}`);
  },

  getProduct(productId: string) {
    return request<Product>(`/products/${productId}`);
  },

  createProduct(payload: Record<string, unknown>) {
    return request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateProduct(productId: string, payload: Record<string, unknown>) {
    return request<Product>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  adjustStock(productId: string, payload: Record<string, unknown>) {
    return request(`/products/${productId}/stock-adjustments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getStockMovements(productId: string, params: { page?: number; pageSize?: number }) {
    return request<PaginatedResponse<StockMovement>>(
      `/products/${productId}/stock-movements${createQueryString(params)}`
    );
  },

  getDashboardStats() {
    return request<{
      totalCustomers: number;
      totalProducts: number;
      lowStockProducts: number;
      recentChallans: any[];
      recentStockMovements: any[];
    }>('/dashboard/stats');
  },

  listChallans(params: {
    q?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    return request<PaginatedResponse<any>>(`/sales-challans${createQueryString(params)}`);
  },

  getChallan(challanId: string) {
    return request<any>(`/sales-challans/${challanId}`);
  },

  createChallan(payload: Record<string, unknown>) {
    return request<any>('/sales-challans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  confirmChallan(challanId: string, payload: Record<string, unknown>) {
    return request<any>(`/sales-challans/${challanId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  cancelChallan(challanId: string) {
    return request<any>(`/sales-challans/${challanId}/cancel`, {
      method: 'POST',
    });
  },
};

export { ApiError };
