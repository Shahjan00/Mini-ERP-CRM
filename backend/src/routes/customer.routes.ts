import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowupNote,
  createCustomerSchema,
  updateCustomerSchema,
  addFollowupSchema,
} from '../controllers/customer.controller';
import { authenticateJwt, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticateJwt);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post(
  '/',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest(createCustomerSchema),
  createCustomer
);
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest(updateCustomerSchema),
  updateCustomer
);
router.post(
  '/:id/followups',
  authorizeRoles('ADMIN', 'SALES'),
  validateRequest(addFollowupSchema),
  addFollowupNote
);

export default router;
