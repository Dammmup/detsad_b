import express from 'express';
import { getAll, getByEntityType, getByEntity } from './controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = express.Router();

router.use(authMiddleware, authorizeRole(['admin', 'manager']));

router.get('/', getAll);
router.get('/entity/:entityType', getByEntityType);
router.get('/entity/:entityType/:entityId', getByEntity);

export default router;
