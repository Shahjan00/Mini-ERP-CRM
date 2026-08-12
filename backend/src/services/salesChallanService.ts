import prisma from '../lib/prisma';
import { AppError } from '../utils/appError';
import { type ChallanStatus } from '../utils/domain';
import { createPaginationMeta, getPagination } from '../utils/pagination';

const { Prisma } = require('@prisma/client');

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

interface CreateChallanPayload {
  challanNumber: string;
  customerId: string;
  createdBy: string;
  items: ChallanItemInput[];
}

interface ChallanListQuery {
  q?: string;
  status?: ChallanStatus;
  page?: unknown;
  pageSize?: unknown;
}

interface CustomerRow {
  id: string;
  name: string;
  businessName: string;
}

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  unitPrice: unknown;
  currentStock: number;
}

interface SalesChallanRow {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: ChallanStatus;
  createdBy: string;
  createdDate: Date;
  updatedAt: Date;
}

interface SalesChallanItemRow {
  id: string;
  salesChallanId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: unknown;
  quantity: number;
}

const joinWithAnd = (parts: any[]) => Prisma.join(parts, Prisma.sql` AND `);

const getChallanSummaryOrThrow = async (challanId: string) => {
  const rows = await prisma.$queryRaw<Array<SalesChallanRow & {
    customerName: string;
    customerBusinessName: string;
  }>>`
    SELECT
      sc.*,
      c."name" AS "customerName",
      c."businessName" AS "customerBusinessName"
    FROM "sales_challans" sc
    INNER JOIN "customers" c ON c."id" = sc."customerId"
    WHERE sc."id" = ${challanId}
    LIMIT 1
  `;

  const challan = rows[0];
  if (!challan) {
    throw new AppError(404, 'Sales challan not found');
  }

  return challan;
};

const getChallanDetail = async (challanId: string) => {
  const challan = await getChallanSummaryOrThrow(challanId);
  const items = await prisma.$queryRaw<SalesChallanItemRow[]>`
    SELECT *
    FROM "sales_challan_items"
    WHERE "salesChallanId" = ${challanId}
    ORDER BY "id" ASC
  `;

  return {
    id: challan.id,
    challanNumber: challan.challanNumber,
    customerId: challan.customerId,
    customer: {
      id: challan.customerId,
      name: challan.customerName,
      businessName: challan.customerBusinessName,
    },
    totalQuantity: challan.totalQuantity,
    status: challan.status,
    createdBy: challan.createdBy,
    createdDate: challan.createdDate,
    updatedAt: challan.updatedAt,
    items,
  };
};

const buildChallanWhere = (query: ChallanListQuery) => {
  const filters: any[] = [];

  if (query.q) {
    const pattern = `%${query.q}%`;
    filters.push(
      Prisma.sql`(
        sc."challanNumber" ILIKE ${pattern}
        OR c."name" ILIKE ${pattern}
        OR c."businessName" ILIKE ${pattern}
      )`
    );
  }

  if (query.status) {
    filters.push(Prisma.sql`sc."status" = ${query.status}`);
  }

  return filters.length > 0 ? Prisma.sql`WHERE ${joinWithAnd(filters)}` : Prisma.empty;
};

export const salesChallanService = {
  async createChallan(payload: CreateChallanPayload) {
    const uniqueProductIds = new Set(payload.items.map((item) => item.productId));
    if (uniqueProductIds.size !== payload.items.length) {
      throw new AppError(400, 'Duplicate products are not allowed in challan items');
    }

    return prisma.$transaction(async (tx: any) => {
      const customerRows = await tx.$queryRaw<CustomerRow[]>`
        SELECT "id", "name", "businessName"
        FROM "customers"
        WHERE "id" = ${payload.customerId}
        LIMIT 1
      `;

      if (!customerRows[0]) {
        throw new AppError(404, 'Customer not found');
      }

      const productIds = [...uniqueProductIds];
      const products = await tx.$queryRaw(Prisma.sql`
        SELECT "id", "name", "sku", "unitPrice", "currentStock"
        FROM "products"
        WHERE "id" IN (${Prisma.join(productIds)})
      `) as ProductRow[];

      if (products.length !== productIds.length) {
        throw new AppError(400, 'One or more products were not found');
      }

      const productsById = new Map<string, ProductRow>(
        products.map((product: ProductRow) => [product.id, product])
      );
      const totalQuantity = payload.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = payload.items.reduce((sum, item) => {
        const product = productsById.get(item.productId);
        return sum + Number(product?.unitPrice ?? 0) * item.quantity;
      }, 0);

      const challanRows = await tx.$queryRaw<SalesChallanRow[]>`
        INSERT INTO "sales_challans" (
          "challanNumber",
          "customerId",
          "totalQuantity",
          "totalAmount",
          "status",
          "createdBy"
        )
        VALUES (
          ${payload.challanNumber},
          ${payload.customerId},
          ${totalQuantity},
          ${totalAmount},
          ${'DRAFT'},
          ${payload.createdBy}
        )
        RETURNING *
      `;

      const challan = challanRows[0];

      for (const item of payload.items) {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new AppError(400, 'Invalid product in challan items');
        }

        await tx.$executeRaw`
          INSERT INTO "sales_challan_items" (
            "salesChallanId",
            "productId",
            "productNameSnapshot",
            "skuSnapshot",
            "unitPriceSnapshot",
            "quantity",
            "totalPrice"
          )
          VALUES (
            ${challan.id},
            ${product.id},
            ${product.name},
            ${product.sku},
            ${product.unitPrice},
            ${item.quantity},
            ${Number(product.unitPrice) * item.quantity}
          )
        `;
      }

      return getChallanDetail(challan.id);
    });
  },

  async listChallans(query: ChallanListQuery) {
    const pagination = getPagination(query.page, query.pageSize);
    const whereSql = buildChallanWhere(query);

    const challans = await prisma.$queryRaw(Prisma.sql`
      SELECT
        sc.*,
        c."name" AS "customerName",
        c."businessName" AS "customerBusinessName",
        COUNT(sci."id")::int AS "itemCount"
      FROM "sales_challans" sc
      INNER JOIN "customers" c ON c."id" = sc."customerId"
      LEFT JOIN "sales_challan_items" sci ON sci."salesChallanId" = sc."id"
      ${whereSql}
      GROUP BY sc."id", c."id"
      ORDER BY sc."createdDate" DESC
      LIMIT ${pagination.pageSize}
      OFFSET ${pagination.skip}
    `) as Array<SalesChallanRow & {
      customerName: string;
      customerBusinessName: string;
      itemCount: number;
    }>;

    const totalRows = await prisma.$queryRaw(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "sales_challans" sc
      INNER JOIN "customers" c ON c."id" = sc."customerId"
      ${whereSql}
    `) as Array<{ count: bigint }>;

    return {
      data: challans.map((challan: any) => ({
        ...challan,
        customer: {
          id: challan.customerId,
          name: challan.customerName,
          businessName: challan.customerBusinessName,
        },
      })),
      meta: createPaginationMeta(Number(totalRows[0]?.count ?? 0), pagination.page, pagination.pageSize),
    };
  },

  async getChallanById(challanId: string) {
    return getChallanDetail(challanId);
  },

  async confirmChallan(challanId: string, actor: string) {
    return prisma.$transaction(async (tx: any) => {
      const challanRows = await tx.$queryRaw<SalesChallanRow[]>`
        SELECT *
        FROM "sales_challans"
        WHERE "id" = ${challanId}
        LIMIT 1
      `;

      const challan = challanRows[0];
      if (!challan) {
        throw new AppError(404, 'Sales challan not found');
      }

      if (challan.status !== 'DRAFT') {
        throw new AppError(409, 'Only draft challans can be confirmed');
      }

      const items = await tx.$queryRaw<Array<SalesChallanItemRow & {
        currentStock: number;
        productName: string;
      }>>`
        SELECT
          sci.*,
          p."currentStock",
          p."name" AS "productName"
        FROM "sales_challan_items" sci
        INNER JOIN "products" p ON p."id" = sci."productId"
        WHERE sci."salesChallanId" = ${challanId}
      `;

      const insufficient = items.filter((item: any) => item.currentStock < item.quantity);
      if (insufficient.length > 0) {
        throw new AppError(
          409,
          `Insufficient stock for: ${insufficient.map((item: any) => item.skuSnapshot).join(', ')}`
        );
      }

      for (const item of items) {
        await tx.$executeRaw`
          UPDATE "products"
          SET
            "currentStock" = "currentStock" - ${item.quantity},
            "updatedAt" = NOW()
          WHERE "id" = ${item.productId}
        `;

        await tx.$executeRaw`
          INSERT INTO "stock_movements" (
            "productId",
            "salesChallanId",
            "movementType",
            "quantity",
            "reason",
            "createdBy"
          )
          VALUES (
            ${item.productId},
            ${challanId},
            ${'OUT'},
            ${item.quantity},
            ${`Sales challan ${challan.challanNumber} confirmed`},
            ${actor}
          )
        `;
      }

      await tx.$executeRaw`
        UPDATE "sales_challans"
        SET
          "status" = ${'CONFIRMED'},
          "updatedAt" = NOW()
        WHERE "id" = ${challanId}
      `;

      return getChallanDetail(challanId);
    });
  },

  async cancelChallan(challanId: string) {
    const challan = await getChallanSummaryOrThrow(challanId);
    if (challan.status !== 'DRAFT') {
      throw new AppError(409, 'Only draft challans can be cancelled');
    }

    await prisma.$executeRaw`
      UPDATE "sales_challans"
      SET
        "status" = ${'CANCELLED'},
        "updatedAt" = NOW()
      WHERE "id" = ${challanId}
    `;

    return getChallanDetail(challanId);
  },
};
