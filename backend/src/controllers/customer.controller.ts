import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendResponse } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Customer name is required'),
    mobile: z.string().min(7, 'Valid mobile number is required'),
    email: z.string().email('Valid email address is required'),
    businessName: z.string().min(2, 'Business name is required'),
    gstNumber: z.string().optional().nullable(),
    customerType: z.enum(['Retail', 'Wholesale', 'Distributor']),
    address: z.string().min(5, 'Address is required'),
    status: z.enum(['Lead', 'Active', 'Inactive']).default('Lead'),
    followupDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    mobile: z.string().min(7).optional(),
    email: z.string().email().optional(),
    businessName: z.string().min(2).optional(),
    gstNumber: z.string().optional().nullable(),
    customerType: z.enum(['Retail', 'Wholesale', 'Distributor']).optional(),
    address: z.string().min(5).optional(),
    status: z.enum(['Lead', 'Active', 'Inactive']).optional(),
    followupDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const addFollowupSchema = z.object({
  body: z.object({
    note: z.string().min(2, 'Followup note content is required'),
    followupDate: z.string().optional().nullable(),
  }),
});

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = req.query.status as string;
    const customerType = req.query.customerType as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { businessName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerType) {
      where.customerType = customerType;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { followups: true, challans: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return sendResponse(res, 200, true, 'Customers fetched successfully', customers, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to fetch customers');
  }
};

export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followups: {
          include: {
            createdBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        challans: {
          select: {
            id: true,
            challanNumber: true,
            grandTotal: true,
            totalQuantity: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      return sendResponse(res, 404, false, 'Customer not found');
    }

    return sendResponse(res, 200, true, 'Customer details retrieved', customer);
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Error fetching customer details');
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      mobile,
      email,
      businessName,
      gstNumber,
      customerType,
      address,
      status,
      followupDate,
      notes,
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email: email.toLowerCase(),
        businessName,
        gstNumber: gstNumber || null,
        customerType,
        address,
        status: status || 'Lead',
        followupDate: followupDate ? new Date(followupDate) : null,
        notes: notes || null,
      },
    });

    return sendResponse(res, 201, true, 'Customer created successfully', customer);
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to create customer');
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (data.followupDate) {
      data.followupDate = new Date(data.followupDate);
    }

    if (data.email) {
      data.email = data.email.toLowerCase();
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    return sendResponse(res, 200, true, 'Customer updated successfully', customer);
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to update customer');
  }
};

export const addFollowupNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note, followupDate } = req.body;

    if (!req.user) {
      return sendResponse(res, 401, false, 'Unauthorized');
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return sendResponse(res, 404, false, 'Customer not found');
    }

    const newFollowupDate = followupDate ? new Date(followupDate) : null;

    const [followup] = await prisma.$transaction([
      prisma.followupNote.create({
        data: {
          customerId: id,
          note,
          followupDate: newFollowupDate,
          createdById: req.user.id,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      prisma.customer.update({
        where: { id },
        data: {
          ...(newFollowupDate && { followupDate: newFollowupDate }),
        },
      }),
    ]);

    return sendResponse(res, 201, true, 'Followup note added successfully', followup);
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to add followup note');
  }
};
