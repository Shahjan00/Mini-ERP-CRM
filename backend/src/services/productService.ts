import prisma from '../lib/prisma';
import { AppError } from '../utils/appError';
import { type MovementType } from '../utils/domain';
import { createPaginationMeta, getPagination } from '../utils/pagination';

const { Prisma } = require('@prisma/client');

interface ProductPayload {
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  minimumStock: number;
  warehouseLocation: string;
}

interface ProductListQuery {
  q?: string;
  lowStock?: string;
  page?: unknown;
  pageSize?: unknown;
}

interface StockAdjustmentPayload {
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdBy: string;
  salesChallanId?: string;
}

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: unknown;
  currentStock: number;
  minimumStock: number;
  warehouseLocation: string;
  createdAt: Date;
  updatedAt: Date;
}

interface StockMovementRow {
  id: string;
  productId: string;
  salesChallanId: string | null;
  movementType: MovementType;
  quantity: number;
  reason: string;
  createdBy: string;
  createdAt: Date;
  challanNumber: string | null;
  challanStatus: string | null;
}

type SqlExecutor = any;

const joinWithAnd = (parts: any[]) => Prisma.join(parts, Prisma.sql` AND `);

const buildProductWhere = (query: ProductListQuery) => {
  const filters: any[] = [];

  if (query.q) {
    const pattern = `%${query.q}%`;
    filters.push(
      Prisma.sql`(
        "name" ILIKE ${pattern}
        OR "sku" ILIKE ${pattern}
        OR "category" ILIKE ${pattern}
        OR "warehouseLocation" ILIKE ${pattern}
      )`
    );
  }

  if (query.lowStock === 'true') {
    filters.push(Prisma.sql`"currentStock" <= "minimumStock"`);
  }

  return filters.length > 0 ? Prisma.sql`WHERE ${joinWithAnd(filters)}` : Prisma.empty;
};

const getProductOrThrow = async (executor: SqlExecutor, productId: string) => {
  const rows = await executor.$queryRaw<ProductRow[]>`
    SELECT *
    FROM "products"
    WHERE "id" = ${productId}
    LIMIT 1
  `;

  const product = rows[0];
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  return product;
};

export const productService = {
  async createProduct(payload: ProductPayload) {
    const rows = await prisma.$queryRaw<ProductRow[]>`
      INSERT INTO "products" (
        "name",
        "sku",
        "category",
        "unitPrice",
        "minimumStock",
        "warehouseLocation"
      )
      VALUES (
        ${payload.name},
        ${payload.sku},
        ${payload.category},
        ${payload.unitPrice},
        ${payload.minimumStock},
        ${payload.warehouseLocation}
      )
      RETURNING *
    `;

    return rows[0];
  },

  async listProducts(query: ProductListQuery) {
    const pagination = getPagination(query.page, query.pageSize);
    const whereSql = buildProductWhere(query);

    const products = await prisma.$queryRaw(Prisma.sql`
      SELECT *
      FROM "products"
      ${whereSql}
      ORDER BY "createdAt" DESC
      LIMIT ${pagination.pageSize}
      OFFSET ${pagination.skip}
    `) as ProductRow[];

    const totalRows = await prisma.$queryRaw(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "products"
      ${whereSql}
    `) as Array<{ count: bigint }>;

    return {
      data: products,
      meta: createPaginationMeta(Number(totalRows[0]?.count ?? 0), pagination.page, pagination.pageSize),
    };
  },

  async getProductById(productId: string) {
    return getProductOrThrow(prisma, productId);
  },

  async updateProduct(productId: string, payload: ProductPayload) {
    await getProductOrThrow(prisma, productId);

    const rows = await prisma.$queryRaw<ProductRow[]>`
      UPDATE "products"
      SET
        "name" = ${payload.name},
        "sku" = ${payload.sku},
        "category" = ${payload.category},
        "unitPrice" = ${payload.unitPrice},
        "minimumStock" = ${payload.minimumStock},
        "warehouseLocation" = ${payload.warehouseLocation},
        "updatedAt" = NOW()
      WHERE "id" = ${productId}
      RETURNING *
    `;

    return rows[0];
  },

  async adjustStock(productId: string, payload: StockAdjustmentPayload) {
    return prisma.$transaction(async (tx: any) => {
      const product = await getProductOrThrow(tx, productId);
      const nextStock = payload.movementType === 'IN'
        ? product.currentStock + payload.quantity
        : product.currentStock - payload.quantity;

      if (nextStock < 0) {
        throw new AppError(409, 'Stock cannot become negative');
      }

      const updatedProductRows = await tx.$queryRaw<ProductRow[]>`
        UPDATE "products"
        SET
          "currentStock" = ${nextStock},
          "updatedAt" = NOW()
        WHERE "id" = ${productId}
        RETURNING *
      `;

      const movementRows = await tx.$queryRaw<Array<{
        id: string;
        productId: string;
        salesChallanId: string | null;
        movementType: MovementType;
        quantity: number;
        reason: string;
        createdBy: string;
        createdAt: Date;
      }>>`
        INSERT INTO "stock_movements" (
          "productId",
          "salesChallanId",
          "movementType",
          "quantity",
          "reason",
          "createdBy"
        )
        VALUES (
          ${productId},
          ${payload.salesChallanId ?? null},
          ${payload.movementType},
          ${payload.quantity},
          ${payload.reason},
          ${payload.createdBy}
        )
        RETURNING *
      `;

      return {
        product: updatedProductRows[0],
        movement: movementRows[0],
      };
    });
  },

  async getStockMovementHistory(productId: string, page?: unknown, pageSize?: unknown) {
    await getProductOrThrow(prisma, productId);
    const pagination = getPagination(page, pageSize);

    const movements = await prisma.$queryRaw(Prisma.sql`
      SELECT
        sm."id",
        sm."productId",
        sm."salesChallanId",
        sm."movementType",
        sm."quantity",
        sm."reason",
        sm."createdBy",
        sm."createdAt",
        sc."challanNumber",
        sc."status" AS "challanStatus"
      FROM "stock_movements" sm
      LEFT JOIN "sales_challans" sc ON sc."id" = sm."salesChallanId"
      WHERE sm."productId" = ${productId}
      ORDER BY sm."createdAt" DESC
      LIMIT ${pagination.pageSize}
      OFFSET ${pagination.skip}
    `) as StockMovementRow[];

    const totalRows = await prisma.$queryRaw(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "stock_movements"
      WHERE "productId" = ${productId}
    `) as Array<{ count: bigint }>;

    return {
      data: movements.map((movement: StockMovementRow) => ({
        id: movement.id,
        productId: movement.productId,
        salesChallanId: movement.salesChallanId,
        movementType: movement.movementType,
        quantity: movement.quantity,
        reason: movement.reason,
        createdBy: movement.createdBy,
        createdAt: movement.createdAt,
        salesChallan: movement.challanNumber
          ? {
              id: movement.salesChallanId as string,
              challanNumber: movement.challanNumber,
              status: movement.challanStatus,
            }
          : null,
      })),
      meta: createPaginationMeta(Number(totalRows[0]?.count ?? 0), pagination.page, pagination.pageSize),
    };
  },
};
