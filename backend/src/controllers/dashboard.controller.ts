import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { sendResponse } from '../utils/response';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalCustomers,
      activeLeads,
      activeCustomers,
      totalProducts,
      products,
      totalChallans,
      confirmedChallans,
      recentChallans,
      recentMovements,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'Lead' } }),
      prisma.customer.count({ where: { status: 'Active' } }),
      prisma.product.count(),
      prisma.product.findMany({ select: { id: true, currentStock: true, minStockAlert: true } }),
      prisma.challan.count(),
      prisma.challan.findMany({
        where: { status: 'CONFIRMED' },
        select: { grandTotal: true, totalQuantity: true },
      }),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, businessName: true } } },
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: { product: { select: { name: true, sku: true } } },
      }),
    ]);

    const lowStockAlertCount = products.filter((p) => p.currentStock <= p.minStockAlert).length;
    const outOfStockCount = products.filter((p) => p.currentStock === 0).length;

    const totalRevenueConfirmed = confirmedChallans.reduce((sum, c) => sum + c.grandTotal, 0);

    return sendResponse(res, 200, true, 'Dashboard summary statistics retrieved', {
      kpis: {
        customers: {
          total: totalCustomers,
          leads: activeLeads,
          active: activeCustomers,
        },
        inventory: {
          totalProducts,
          lowStockAlerts: lowStockAlertCount,
          outOfStock: outOfStockCount,
        },
        challans: {
          total: totalChallans,
          confirmedCount: confirmedChallans.length,
          totalRevenue: totalRevenueConfirmed,
        },
      },
      feeds: {
        recentChallans,
        recentMovements,
      },
    });
  } catch (error: any) {
    return sendResponse(res, 500, false, error.message || 'Failed to fetch dashboard stats');
  }
};
