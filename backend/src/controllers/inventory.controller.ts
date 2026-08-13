import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const adjustStockSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    quantity: z.number().int().positive('Quantity must be greater than 0'),
    movementType: z.enum(['IN', 'OUT']),
    reason: z.string().min(2, 'Reason for stock adjustment is required'),
  }),
});

export const adjustStock = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, quantity, movementType, reason } = req.body;

    if (!req.user) {
      return sendResponse(res, 401, false, 'Unauthorized');
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return sendResponse(res, 404, false, 'Product not found');
    }

    // Check stock sufficiency for OUT movements
    if (movementType === 'OUT' && product.currentStock < quantity) {
      return sendResponse(
        res,
        400,
        false,
        `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Requested: ${quantity}, Available: ${product.currentStock}`
      );
    }

    const quantityChanged = movementType === 'IN' ? quantity : -quantity;

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: {
            increment: quantityChanged,
          },
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          quantityChanged,
          movementType,
          reason,
          createdById: req.user!.id,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      return { updatedProduct, movement };
    });

    return sendResponse(
      res,
      200,
      true,
      `Stock successfully adjusted (${movementType} ${quantity} units)`,
      result
    );
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to adjust stock');
  }
};

export const getStockLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const productId = req.query.productId as string;
    const movementType = req.query.movementType as string;
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { product: { name: { contains: search } } },
        { product: { sku: { contains: search } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendResponse(res, 200, true, 'Stock movement logs retrieved', logs, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to fetch stock logs');
  }
};
