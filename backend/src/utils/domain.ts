export const CUSTOMER_TYPES = ['RETAIL', 'WHOLESALE', 'DISTRIBUTOR'] as const;
export type CustomerType = typeof CUSTOMER_TYPES[number];

export const CUSTOMER_STATUSES = ['LEAD', 'ACTIVE', 'INACTIVE'] as const;
export type CustomerStatus = typeof CUSTOMER_STATUSES[number];

export const MOVEMENT_TYPES = ['IN', 'OUT'] as const;
export type MovementType = typeof MOVEMENT_TYPES[number];

export const CHALLAN_STATUSES = ['DRAFT', 'CONFIRMED', 'CANCELLED'] as const;
export type ChallanStatus = typeof CHALLAN_STATUSES[number];
