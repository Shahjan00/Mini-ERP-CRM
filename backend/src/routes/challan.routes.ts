import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  createChallanSchema,
  updateChallanStatusSchema,
} from '../controllers/challan.controller';
import { authenticateJwt, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticateJwt);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest(createChallanSchema),
  createChallan
);
router.put(
  '/:id/status',
  authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'),
  validateRequest(updateChallanStatusSchema),
  updateChallanStatus
);

export default router;
