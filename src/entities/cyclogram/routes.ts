import { Router } from 'express';
import { activityTemplateController } from './activityTemplate/controller';
import { dailyScheduleController } from './dailySchedule/controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import { authorizeRole } from '../../middlewares/authRole';

const router = Router();

router.use(authMiddleware);

const managerAuth = authorizeRole(['admin', 'manager']);

// Activity Templates — специфические маршруты ПЕРЕД /:id
router.get('/activity-templates', activityTemplateController.getAll);
router.get('/activity-templates/types', activityTemplateController.getActivityTypes);
router.get('/activity-templates/by-type/:type', activityTemplateController.getByType);
router.get('/activity-templates/:id', activityTemplateController.getById);
router.post('/activity-templates', managerAuth, activityTemplateController.create);
router.put('/activity-templates/:id', managerAuth, activityTemplateController.update);
router.delete('/activity-templates/:id', managerAuth, activityTemplateController.delete);

// Daily Schedules — специфические маршруты ПЕРЕД /:id
router.get('/daily-schedules', dailyScheduleController.getAll);
router.get('/daily-schedules/templates', dailyScheduleController.getTemplates);
router.get('/daily-schedules/week', dailyScheduleController.getWeekSchedule);
router.get('/daily-schedules/by-group-date', dailyScheduleController.getByGroupAndDate);
router.get('/daily-schedules/:id', dailyScheduleController.getById);
router.post('/daily-schedules', managerAuth, dailyScheduleController.create);
router.put('/daily-schedules/:id', managerAuth, dailyScheduleController.update);
router.put('/daily-schedules/:id/blocks', managerAuth, dailyScheduleController.updateBlocks);
router.delete('/daily-schedules/:id', managerAuth, dailyScheduleController.delete);
router.post('/daily-schedules/copy-week', managerAuth, dailyScheduleController.copyFromPreviousWeek);

export default router;
