import { Router } from 'express';
import { productController } from '../controllers/productController';
import { asyncHandler } from '../utils/asyncHandler';
import { authorize } from '../middleware/auth';

const router = Router();

router.post('/', authorize('ADMIN', 'WAREHOUSE'), asyncHandler(productController.createProduct));
router.get('/', authorize('ADMIN', 'SALES', 'WAREHOUSE'), asyncHandler(productController.listProducts));
router.get('/:productId', authorize('ADMIN', 'SALES', 'WAREHOUSE'), asyncHandler(productController.getProductById));
router.put('/:productId', authorize('ADMIN', 'WAREHOUSE'), asyncHandler(productController.updateProduct));
router.post('/:productId/stock-adjustments', authorize('ADMIN', 'WAREHOUSE'), asyncHandler(productController.adjustStock));
router.get('/:productId/stock-movements', authorize('ADMIN', 'WAREHOUSE'), asyncHandler(productController.getStockMovementHistory));

export default router;
