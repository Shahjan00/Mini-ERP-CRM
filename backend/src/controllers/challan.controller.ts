import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          quantity: z.number().int().positive('Quantity must be greater than 0'),
          unitPrice: z.number().positive().optional(),
        })
      )
      .min(1, 'At least one product item is required in the challan'),
  }),
});

export const updateChallanStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']),
  }),
});

const generateChallanNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await prisma.challan.count({
    where: {
      challanNumber: {
        startsWith: `CH-${dateStr}-`,
      },
    },
  });
  const seqStr = String(countToday + 1).padStart(4, '0');
  return `CH-${dateStr}-${seqStr}`;
};

export const getChallans = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const customerId = req.query.customerId as string;
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { customerNameSnapshot: { contains: search } },
        { customerEmailSnapshot: { contains: search } },
      ];
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, businessName: true, email: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.challan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendResponse(res, 200, true, 'Sales challans retrieved successfully', challans, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to fetch challans');
  }
};

export const getChallanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        items: {
          include: {
            product: { select: { id: true, currentStock: true, minStockAlert: true, location: true } },
          },
        },
      },
    });

    if (!challan) {
      return sendResponse(res, 404, false, 'Sales challan not found');
    }

    return sendResponse(res, 200, true, 'Challan details retrieved', challan);
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to fetch challan details');
  }
};

export const createChallan = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, status, items } = req.body;

    if (!req.user) {
      return sendResponse(res, 401, false, 'Unauthorized');
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return sendResponse(res, 404, false, 'Customer not found');
    }

    // Fetch products to verify existence & stock levels
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== productIds.length) {
      return sendResponse(res, 400, false, 'One or more products specified in items do not exist.');
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Check stock if status is CONFIRMED
    if (status === 'CONFIRMED') {
      const stockErrors: string[] = [];

      for (const item of items) {
        const prod = productMap.get(item.productId)!;
        if (prod.currentStock < item.quantity) {
          stockErrors.push(
            `Insufficient stock for '${prod.name}' (SKU: ${prod.sku}). Requested: ${item.quantity}, Available stock: ${prod.currentStock}`
          );
        }
      }

      if (stockErrors.length > 0) {
        return sendResponse(
          res,
          400,
          false,
          'Cannot confirm challan due to insufficient stock.',
          null,
          undefined,
          stockErrors
        );
      }
    }

    // Calculate totals & item snapshots
    let totalQuantity = 0;
    let grandTotal = 0;

    const preparedItems = items.map((item: any) => {
      const prod = productMap.get(item.productId)!;
      const unitPrice = item.unitPrice !== undefined ? item.unitPrice : prod.unitPrice;
      const lineTotal = unitPrice * item.quantity;

      totalQuantity += item.quantity;
      grandTotal += lineTotal;

      return {
        productId: prod.id,
        productNameSnapshot: prod.name,
        skuSnapshot: prod.sku,
        unitPriceSnapshot: unitPrice,
        quantity: item.quantity,
        lineTotal,
      };
    });

    const challanNumber = await generateChallanNumber();

    // Execute atomic transaction for creation and stock deduction
    const challan = await prisma.$transaction(async (tx) => {
      const newChallan = await tx.challan.create({
        data: {
          challanNumber,
          customerId: customer.id,
          customerNameSnapshot: customer.businessName || customer.name,
          customerEmailSnapshot: customer.email,
          customerMobileSnapshot: customer.mobile,
          totalQuantity,
          grandTotal,
          status,
          createdById: req.user!.id,
          items: {
            create: preparedItems,
          },
        },
        include: {
          items: true,
          customer: true,
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      // Stock reduction & audit movement logging if CONFIRMED
      if (status === 'CONFIRMED') {
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: -item.quantity,
              movementType: 'OUT',
              reason: `Challan Dispatch Confirmed: ${newChallan.challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      return newChallan;
    });

    return sendResponse(
      res,
      201,
      true,
      `Sales Challan created successfully in ${status} status`,
      challan
    );
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to create sales challan');
  }
};

export const updateChallanStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status: targetStatus } = req.body;

    if (!req.user) {
      return sendResponse(res, 401, false, 'Unauthorized');
    }

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return sendResponse(res, 404, false, 'Sales challan not found');
    }

    if (challan.status === targetStatus) {
      return sendResponse(res, 400, false, `Challan is already in '${targetStatus}' status.`);
    }

    // Handle transition logic
    const updatedChallan = await prisma.$transaction(async (tx) => {
      // Transition from DRAFT to CONFIRMED
      if (challan.status === 'DRAFT' && targetStatus === 'CONFIRMED') {
        // Stock check
        for (const item of challan.items) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (!prod || prod.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for '${item.productNameSnapshot}' (SKU: ${item.skuSnapshot}). Requested: ${item.quantity}, Available: ${prod?.currentStock || 0}`
            );
          }
        }

        // Reduce stock & log movement
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: -item.quantity,
              movementType: 'OUT',
              reason: `Challan Status Confirmed: ${challan.challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      // Transition from CONFIRMED to CANCELLED (Restores stock)
      if (challan.status === 'CONFIRMED' && targetStatus === 'CANCELLED') {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'IN',
              reason: `Challan Cancellation Stock Restoration: ${challan.challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      const resChallan = await tx.challan.update({
        where: { id },
        data: { status: targetStatus },
        include: {
          items: true,
          customer: true,
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      return resChallan;
    });

    return sendResponse(
      res,
      200,
      true,
      `Challan status updated to ${targetStatus} successfully`,
      updatedChallan
    );
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message || 'Failed to update challan status');
  }
};
