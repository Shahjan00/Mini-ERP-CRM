import { Router } from 'express';
import { salesChallanController } from '../controllers/salesChallanController';
import { asyncHandler } from '../utils/asyncHandler';
import { authorize } from '../middleware/auth';

const router = Router();

router.post('/', authorize('ADMIN', 'SALES'), asyncHandler(salesChallanController.createChallan));
router.get('/', authorize('ADMIN', 'SALES', 'ACCOUNTS'), asyncHandler(salesChallanController.listChallans));
router.get('/:challanId', authorize('ADMIN', 'SALES', 'ACCOUNTS'), asyncHandler(salesChallanController.getChallanById));
router.post('/:challanId/confirm', authorize('ADMIN', 'SALES'), asyncHandler(salesChallanController.confirmChallan));
router.post('/:challanId/cancel', authorize('ADMIN', 'SALES'), asyncHandler(salesChallanController.cancelChallan));

export default router;
