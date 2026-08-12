import { Request, Response } from 'express';
import { customerService } from '../services/customerService';
import type { CustomerStatus, CustomerType } from '../utils/domain';
import {
  optionalNullableString,
  optionalString,
  parseCustomerStatus,
  parseCustomerType,
  parseOptionalDate,
  requireString,
  validateEmail,
} from '../utils/validation';

const parseCustomerPayload = (body: Record<string, unknown>) => {
  const email = optionalString(body.email);
  validateEmail(email);

  return {
    name: requireString(body.name, 'name'),
    mobile: requireString(body.mobile, 'mobile'),
    email,
    businessName: requireString(body.businessName, 'businessName'),
    gstNumber: optionalNullableString(body.gstNumber),
    customerType: parseCustomerType(body.customerType),
    address: requireString(body.address, 'address'),
    status: parseCustomerStatus(body.status ?? 'LEAD'),
    followUpDate: parseOptionalDate(body.followUpDate, 'followUpDate'),
    notes: optionalNullableString(body.notes),
  };
};

const parseQueryStatus = (status?: unknown): CustomerStatus | undefined => {
  if (typeof status !== 'string' || !status.trim()) {
    return undefined;
  }

  return parseCustomerStatus(status);
};

const parseQueryType = (customerType?: unknown): CustomerType | undefined => {
  if (typeof customerType !== 'string' || !customerType.trim()) {
    return undefined;
  }

  return parseCustomerType(customerType);
};

export const customerController = {
  async createCustomer(req: Request, res: Response) {
    const customer = await customerService.createCustomer(parseCustomerPayload(req.body));
    res.status(201).json(customer);
  },

  async listCustomers(req: Request, res: Response) {
    const result = await customerService.listCustomers({
      q: optionalString(req.query.q),
      status: parseQueryStatus(req.query.status),
      customerType: parseQueryType(req.query.customerType),
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    res.json(result);
  },

  async searchCustomers(req: Request, res: Response) {
    const result = await customerService.listCustomers({
      q: optionalString(req.query.q),
      status: parseQueryStatus(req.query.status),
      customerType: parseQueryType(req.query.customerType),
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    res.json(result);
  },

  async getCustomerById(req: Request, res: Response) {
    const customer = await customerService.getCustomerById(req.params.customerId);
    res.json(customer);
  },

  async updateCustomer(req: Request, res: Response) {
    const customer = await customerService.updateCustomer(
      req.params.customerId,
      parseCustomerPayload(req.body)
    );

    res.json(customer);
  },

  async addFollowUpNote(req: Request, res: Response) {
    const followUpNote = await customerService.addFollowUpNote(req.params.customerId, {
      note: requireString(req.body.note, 'note'),
      followUpDate: parseOptionalDate(req.body.followUpDate, 'followUpDate'),
      createdBy: optionalString(req.body.createdBy),
    });

    res.status(201).json(followUpNote);
  },
};
