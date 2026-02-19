import { Router } from 'express';
import { weeklyMenuTemplateController } from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';
import { authorizeRole } from '../../../middlewares/authRole';

const router = Router();

router.use(authMiddleware);

const managerAuth = authorizeRole(['admin', 'manager']);

// CRUD
router.get('/', (req, res, next) => weeklyMenuTemplateController.getAll(req, res, next));
router.get('/:id', (req, res, next) => weeklyMenuTemplateController.getById(req, res, next));
router.post('/', managerAuth, (req, res, next) => weeklyMenuTemplateController.create(req, res, next));
router.put('/:id', managerAuth, (req, res, next) => weeklyMenuTemplateController.update(req, res, next));
router.delete('/:id', managerAuth, (req, res, next) => weeklyMenuTemplateController.delete(req, res, next));

// Управление блюдами
router.post('/:id/dish', managerAuth, (req, res, next) => weeklyMenuTemplateController.addDishToDay(req, res, next));
router.delete('/:id/:day/:mealType/:dishId', managerAuth, (req, res, next) => weeklyMenuTemplateController.removeDishFromDay(req, res, next));

// Применение шаблона
router.post('/:id/apply-week', managerAuth, (req, res, next) => weeklyMenuTemplateController.applyToWeek(req, res, next));
router.post('/:id/apply-month', managerAuth, (req, res, next) => weeklyMenuTemplateController.applyToMonth(req, res, next));

// Расчёт требуемых продуктов
router.get('/:id/required-products', (req, res, next) => weeklyMenuTemplateController.calculateRequiredProducts(req, res, next));

export default router;
