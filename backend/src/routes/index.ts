import { Router } from 'express';
import authRoutes from './auth';
import customerRoutes from './customers';
import productRoutes from './products';
import salesChallanRoutes from './salesChallans';
import dashboardRoutes from './dashboard';
import { authenticate } from '../middleware/auth';

const router = Router();

// Health check endpoint
router.get('/health', (req: any, res: any) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auth routes
router.use('/auth', authRoutes);

// Authenticate all remaining API routes
router.use(authenticate);

router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/sales-challans', salesChallanRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
