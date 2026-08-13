import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  createProductSchema,
  updateProductSchema,
} from '../controllers/product.controller';
import { authenticateJwt, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticateJwt);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post(
  '/',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateRequest(createProductSchema),
  createProduct
);
router.put(
  '/:id',
  authorizeRoles('ADMIN', 'WAREHOUSE'),
  validateRequest(updateProductSchema),
  updateProduct
);

export default router;
