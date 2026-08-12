import {
  CHALLAN_STATUSES,
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
  MOVEMENT_TYPES,
  type ChallanStatus,
  type CustomerStatus,
  type CustomerType,
  type MovementType,
} from './domain';
import { AppError } from './appError';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const requireString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(400, `${fieldName} is required`);
  }

  return value.trim();
};

export const optionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(400, 'Invalid string value');
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

export const optionalNullableString = (value: unknown): string | null | undefined => {
  if (value === null) {
    return null;
  }

  return optionalString(value);
};

export const requirePositiveInteger = (value: unknown, fieldName: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(400, `${fieldName} must be a positive integer`);
  }

  return parsed;
};

export const requireNonNegativeInteger = (value: unknown, fieldName: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError(400, `${fieldName} must be a non-negative integer`);
  }

  return parsed;
};

export const requireNumber = (value: unknown, fieldName: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(400, `${fieldName} must be a valid non-negative number`);
  }

  return parsed;
};

export const validateEmail = (value: string | undefined) => {
  if (value && !emailRegex.test(value)) {
    throw new AppError(400, 'email must be a valid email address');
  }
};

const ensureEnumValue = <T extends string>(
  value: unknown,
  allowedValues: T[],
  fieldName: string
): T => {
  if (typeof value !== 'string') {
    throw new AppError(400, `${fieldName} is required`);
  }

  const normalized = value.trim().toUpperCase() as T;
  if (!allowedValues.includes(normalized)) {
    throw new AppError(400, `${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }

  return normalized;
};

export const parseCustomerType = (value: unknown): CustomerType => {
  return ensureEnumValue(value, [...CUSTOMER_TYPES], 'customerType') as CustomerType;
};

export const parseCustomerStatus = (value: unknown): CustomerStatus => {
  return ensureEnumValue(value, [...CUSTOMER_STATUSES], 'status') as CustomerStatus;
};

export const parseMovementType = (value: unknown): MovementType => {
  return ensureEnumValue(value, [...MOVEMENT_TYPES], 'movementType') as MovementType;
};

export const parseChallanStatus = (value: unknown): ChallanStatus => {
  return ensureEnumValue(value, [...CHALLAN_STATUSES], 'status') as ChallanStatus;
};

export const parseOptionalDate = (value: unknown, fieldName: string): Date | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `${fieldName} must be a valid date`);
  }

  return date;
};
