import { Router } from 'express';
import prisma from '../lib/prisma';
import { authorize } from '../middleware/auth';

const router = Router();

router.get('/stats', authorize('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), async (req: any, res: any) => {
  try {
    const [
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentChallans,
      recentStockMovements
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.product.count({
        where: {
          currentStock: {
            lt: 10
          }
        }
      }),
      prisma.salesChallan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          items: true
        }
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true
        }
      })
    ]);

    res.json({
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentChallans,
      recentStockMovements
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
