import { Router } from 'express';
import { customerController } from '../controllers/customerController';
import { asyncHandler } from '../utils/asyncHandler';
import { authorize } from '../middleware/auth';

const router = Router();

router.post('/', authorize('ADMIN', 'SALES'), asyncHandler(customerController.createCustomer));
router.get('/', authorize('ADMIN', 'SALES', 'ACCOUNTS'), asyncHandler(customerController.listCustomers));
router.get('/search', authorize('ADMIN', 'SALES', 'ACCOUNTS'), asyncHandler(customerController.searchCustomers));
router.get('/:customerId', authorize('ADMIN', 'SALES', 'ACCOUNTS'), asyncHandler(customerController.getCustomerById));
router.put('/:customerId', authorize('ADMIN', 'SALES'), asyncHandler(customerController.updateCustomer));
router.post('/:customerId/follow-up-notes', authorize('ADMIN', 'SALES'), asyncHandler(customerController.addFollowUpNote));

export default router;
