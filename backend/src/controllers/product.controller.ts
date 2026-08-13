import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    sku: z.string().min(2, 'SKU is required'),
    category: z.string().min(2, 'Category is required'),
    unitPrice: z.number().positive('Price must be greater than 0'),
    currentStock: z.number().int().nonnegative('Stock cannot be negative').default(0),
    minStockAlert: z.number().int().nonnegative().default(5),
    location: z.string().min(2, 'Warehouse location is required'),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    sku: z.string().min(2).optional(),
    category: z.string().min(2).optional(),
    unitPrice: z.number().positive().optional(),
    minStockAlert: z.number().int().nonnegative().optional(),
    location: z.string().min(2).optional(),
  }),
});

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = req.query.category as string;
    const isLowStock = req.query.isLowStock === 'true';

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { location: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Format products with isLowStock computed flag
    const formattedProducts = products.map((prod) => ({
      ...prod,
      isLowStock: prod.currentStock <= prod.minStockAlert,
    }));

    // Filter low stock if requested explicitly
    const finalProducts = isLowStock
      ? formattedProducts.filter((p) => p.isLowStock)
      : formattedProducts;

    const totalPages = Math.ceil(total / limit);

    return sendResponse(res, 200, true, 'Products retrieved successfully', finalProducts, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to fetch products');
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        movements: {
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
      },
    });

    if (!product) {
      return sendResponse(res, 404, false, 'Product not found');
    }

    return sendResponse(res, 200, true, 'Product details retrieved', {
      ...product,
      isLowStock: product.currentStock <= product.minStockAlert,
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to fetch product details');
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;

    if (!req.user) {
      return sendResponse(res, 401, false, 'Unauthorized');
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku: sku.trim().toUpperCase() },
    });

    if (existingSku) {
      return sendResponse(res, 400, false, `Product SKU '${sku}' already exists.`);
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProd = await tx.product.create({
        data: {
          name,
          sku: sku.trim().toUpperCase(),
          category,
          unitPrice,
          currentStock: currentStock || 0,
          minStockAlert: minStockAlert ?? 5,
          location,
        },
      });

      if (currentStock && currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: newProd.id,
            quantityChanged: currentStock,
            movementType: 'IN',
            reason: 'Initial Opening Stock Entry on Product Creation',
            createdById: req.user!.id,
          },
        });
      }

      return newProd;
    });

    return sendResponse(res, 201, true, 'Product created successfully', product);
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to create product');
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.sku) {
      data.sku = data.sku.trim().toUpperCase();
      const existingSku = await prisma.product.findFirst({
        where: { sku: data.sku, NOT: { id } },
      });
      if (existingSku) {
        return sendResponse(res, 400, false, `SKU '${data.sku}' is already in use.`);
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return sendResponse(res, 200, true, 'Product updated successfully', product);
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to update product');
  }
};
