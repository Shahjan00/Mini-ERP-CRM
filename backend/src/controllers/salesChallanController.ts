import { Request, Response } from 'express';
import { salesChallanService } from '../services/salesChallanService';
import type { ChallanStatus } from '../utils/domain';
import {
  optionalString,
  parseChallanStatus,
  requirePositiveInteger,
  requireString,
} from '../utils/validation';
import { AppError } from '../utils/appError';

const parseChallanStatusFilter = (value?: unknown): ChallanStatus | undefined => {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  return parseChallanStatus(value);
};

const parseItems = (value: unknown) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError(400, 'items must be a non-empty array');
  }

  return value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(400, `items[${index}] must be an object`);
    }

    const record = item as Record<string, unknown>;
    return {
      productId: requireString(record.productId, `items[${index}].productId`),
      quantity: requirePositiveInteger(record.quantity, `items[${index}].quantity`),
    };
  });
};

export const salesChallanController = {
  async createChallan(req: Request, res: Response) {
    const challan = await salesChallanService.createChallan({
      challanNumber: requireString(req.body.challanNumber, 'challanNumber'),
      customerId: requireString(req.body.customerId, 'customerId'),
      createdBy: requireString(req.body.createdBy, 'createdBy'),
      items: parseItems(req.body.items),
    });

    res.status(201).json(challan);
  },

  async listChallans(req: Request, res: Response) {
    const result = await salesChallanService.listChallans({
      q: optionalString(req.query.q),
      status: parseChallanStatusFilter(req.query.status),
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    res.json(result);
  },

  async getChallanById(req: Request, res: Response) {
    const challan = await salesChallanService.getChallanById(req.params.challanId);
    res.json(challan);
  },

  async confirmChallan(req: Request, res: Response) {
    const challan = await salesChallanService.confirmChallan(
      req.params.challanId,
      requireString(req.body.createdBy, 'createdBy')
    );

    res.json(challan);
  },

  async cancelChallan(req: Request, res: Response) {
    const challan = await salesChallanService.cancelChallan(req.params.challanId);
    res.json(challan);
  },
};
