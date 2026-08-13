import { Router } from 'express';
import { adjustStock, getStockLogs, adjustStockSchema } from '../controllers/inventory.controller';
import { authenticateJwt, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticateJwt);

router.post(
  '/adjust',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateRequest(adjustStockSchema),
  adjustStock
);
router.get('/logs', getStockLogs);

export default router;
