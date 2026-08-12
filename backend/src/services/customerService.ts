import prisma from '../lib/prisma';
import { AppError } from '../utils/appError';
import { type CustomerStatus, type CustomerType } from '../utils/domain';
import { createPaginationMeta, getPagination } from '../utils/pagination';

const { Prisma } = require('@prisma/client');

interface CustomerPayload {
  name: string;
  mobile: string;
  email?: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: Date;
  notes?: string | null;
}

interface FollowUpPayload {
  note: string;
  followUpDate?: Date;
  createdBy?: string;
}

interface CustomerQuery {
  q?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
  page?: unknown;
  pageSize?: unknown;
}

interface CustomerRow {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  businessName: string;
  gstNumber: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerFollowUpRow {
  id: string;
  customerId: string;
  note: string;
  followUpDate: Date | null;
  createdBy: string | null;
  createdAt: Date;
}

interface CustomerChallanRow {
  id: string;
  challanNumber: string;
  status: string;
  totalQuantity: number;
  createdDate: Date;
}

const joinWithAnd = (parts: any[]) => Prisma.join(parts, Prisma.sql` AND `);

const buildCustomerWhere = (query: CustomerQuery) => {
  const filters: any[] = [];

  if (query.q) {
    const pattern = `%${query.q}%`;
    filters.push(
      Prisma.sql`(
        "name" ILIKE ${pattern}
        OR "mobile" ILIKE ${pattern}
        OR COALESCE("email", '') ILIKE ${pattern}
        OR "businessName" ILIKE ${pattern}
        OR COALESCE("gstNumber", '') ILIKE ${pattern}
      )`
    );
  }

  if (query.status) {
    filters.push(Prisma.sql`"status" = ${query.status}`);
  }

  if (query.customerType) {
    filters.push(Prisma.sql`"customerType" = ${query.customerType}`);
  }

  return filters.length > 0 ? Prisma.sql`WHERE ${joinWithAnd(filters)}` : Prisma.empty;
};

const getCustomerOrThrow = async (customerId: string) => {
  const rows = await prisma.$queryRaw<CustomerRow[]>`
    SELECT *
    FROM "customers"
    WHERE "id" = ${customerId}
    LIMIT 1
  `;

  const customer = rows[0];
  if (!customer) {
    throw new AppError(404, 'Customer not found');
  }

  return customer;
};

export const customerService = {
  async createCustomer(payload: CustomerPayload) {
    const rows = await prisma.$queryRaw<CustomerRow[]>`
      INSERT INTO "customers" (
        "name",
        "mobile",
        "email",
        "businessName",
        "gstNumber",
        "customerType",
        "address",
        "status",
        "followUpDate",
        "notes"
      )
      VALUES (
        ${payload.name},
        ${payload.mobile},
        ${payload.email ?? null},
        ${payload.businessName},
        ${payload.gstNumber ?? null},
        ${payload.customerType},
        ${payload.address},
        ${payload.status},
        ${payload.followUpDate ?? null},
        ${payload.notes ?? null}
      )
      RETURNING *
    `;

    return rows[0];
  },

  async listCustomers(query: CustomerQuery) {
    const pagination = getPagination(query.page, query.pageSize);
    const whereSql = buildCustomerWhere(query);

    const customers = await prisma.$queryRaw(Prisma.sql`
      SELECT *
      FROM "customers"
      ${whereSql}
      ORDER BY "createdAt" DESC
      LIMIT ${pagination.pageSize}
      OFFSET ${pagination.skip}
    `) as CustomerRow[];

    const totalRows = await prisma.$queryRaw(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "customers"
      ${whereSql}
    `) as Array<{ count: bigint }>;

    return {
      data: customers,
      meta: createPaginationMeta(Number(totalRows[0]?.count ?? 0), pagination.page, pagination.pageSize),
    };
  },

  async getCustomerById(customerId: string) {
    const customer = await getCustomerOrThrow(customerId);

    const followUpNotes = await prisma.$queryRaw`
      SELECT *
      FROM "customer_follow_up_notes"
      WHERE "customerId" = ${customerId}
      ORDER BY "createdAt" DESC
    ` as CustomerFollowUpRow[];

    const salesChallans = await prisma.$queryRaw`
      SELECT "id", "challanNumber", "status", "totalQuantity", "createdDate"
      FROM "sales_challans"
      WHERE "customerId" = ${customerId}
      ORDER BY "createdDate" DESC
    ` as CustomerChallanRow[];

    return {
      ...customer,
      followUpNotes,
      salesChallans,
    };
  },

  async updateCustomer(customerId: string, payload: CustomerPayload) {
    await getCustomerOrThrow(customerId);

    const rows = await prisma.$queryRaw<CustomerRow[]>`
      UPDATE "customers"
      SET
        "name" = ${payload.name},
        "mobile" = ${payload.mobile},
        "email" = ${payload.email ?? null},
        "businessName" = ${payload.businessName},
        "gstNumber" = ${payload.gstNumber ?? null},
        "customerType" = ${payload.customerType},
        "address" = ${payload.address},
        "status" = ${payload.status},
        "followUpDate" = ${payload.followUpDate ?? null},
        "notes" = ${payload.notes ?? null},
        "updatedAt" = NOW()
      WHERE "id" = ${customerId}
      RETURNING *
    `;

    return rows[0];
  },

  async addFollowUpNote(customerId: string, payload: FollowUpPayload) {
    await getCustomerOrThrow(customerId);

    const rows = await prisma.$queryRaw<CustomerFollowUpRow[]>`
      INSERT INTO "customer_follow_up_notes" (
        "customerId",
        "note",
        "followUpDate",
        "createdBy"
      )
      VALUES (
        ${customerId},
        ${payload.note},
        ${payload.followUpDate ?? null},
        ${payload.createdBy ?? null}
      )
      RETURNING *
    `;

    return rows[0];
  },
};
