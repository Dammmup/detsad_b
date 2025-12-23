import { Router } from 'express';
import { weeklyMenuTemplateController } from './controller';
import { authMiddleware } from '../../../middlewares/authMiddleware';

const router = Router();

// Все роуты требуют авторизации
router.use(authMiddleware);

// CRUD
router.get('/', (req, res, next) => weeklyMenuTemplateController.getAll(req, res, next));
router.get('/:id', (req, res, next) => weeklyMenuTemplateController.getById(req, res, next));
router.post('/', (req, res, next) => weeklyMenuTemplateController.create(req, res, next));
router.put('/:id', (req, res, next) => weeklyMenuTemplateController.update(req, res, next));
router.delete('/:id', (req, res, next) => weeklyMenuTemplateController.delete(req, res, next));

// Управление блюдами
router.post('/:id/dish', (req, res, next) => weeklyMenuTemplateController.addDishToDay(req, res, next));
router.delete('/:id/:day/:mealType/:dishId', (req, res, next) => weeklyMenuTemplateController.removeDishFromDay(req, res, next));

// Применение шаблона
router.post('/:id/apply-week', (req, res, next) => weeklyMenuTemplateController.applyToWeek(req, res, next));
router.post('/:id/apply-month', (req, res, next) => weeklyMenuTemplateController.applyToMonth(req, res, next));

// Расчёт требуемых продуктов
router.get('/:id/required-products', (req, res, next) => weeklyMenuTemplateController.calculateRequiredProducts(req, res, next));

export default router;
