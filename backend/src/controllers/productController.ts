import { Request, Response } from 'express';
import { productService } from '../services/productService';
import {
  optionalString,
  parseMovementType,
  requireNonNegativeInteger,
  requireNumber,
  requirePositiveInteger,
  requireString,
} from '../utils/validation';

const parseProductPayload = (body: Record<string, unknown>) => ({
  name: requireString(body.name, 'name'),
  sku: requireString(body.sku, 'SKU'),
  category: requireString(body.category, 'category'),
  unitPrice: requireNumber(body.unitPrice, 'unitPrice'),
  minimumStock: requireNonNegativeInteger(body.minimumStock, 'minimumStock'),
  warehouseLocation: requireString(body.warehouseLocation, 'warehouseLocation'),
});

export const productController = {
  async createProduct(req: Request, res: Response) {
    const product = await productService.createProduct(parseProductPayload(req.body));
    res.status(201).json(product);
  },

  async listProducts(req: Request, res: Response) {
    const result = await productService.listProducts({
      q: optionalString(req.query.q),
      lowStock: typeof req.query.lowStock === 'string' ? req.query.lowStock : undefined,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    res.json(result);
  },

  async updateProduct(req: Request, res: Response) {
    const product = await productService.updateProduct(
      req.params.productId,
      parseProductPayload(req.body)
    );

    res.json(product);
  },

  async getProductById(req: Request, res: Response) {
    const product = await productService.getProductById(req.params.productId);
    res.json(product);
  },

  async adjustStock(req: Request, res: Response) {
    const result = await productService.adjustStock(req.params.productId, {
      quantity: requirePositiveInteger(req.body.quantity, 'quantity'),
      movementType: parseMovementType(req.body.movementType),
      reason: requireString(req.body.reason, 'reason'),
      createdBy: requireString(req.body.createdBy, 'createdBy'),
    });

    res.status(201).json(result);
  },

  async getStockMovementHistory(req: Request, res: Response) {
    const result = await productService.getStockMovementHistory(
      req.params.productId,
      req.query.page,
      req.query.pageSize
    );

    res.json(result);
  },
};
