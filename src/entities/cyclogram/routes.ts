import { Router } from 'express';
import { activityTemplateController } from './activityTemplate/controller';
import { dailyScheduleController } from './dailySchedule/controller';

const router = Router();

// Activity Templates
router.get('/activity-templates', activityTemplateController.getAll);
router.get('/activity-templates/types', activityTemplateController.getActivityTypes);
router.get('/activity-templates/:id', activityTemplateController.getById);
router.get('/activity-templates/by-type/:type', activityTemplateController.getByType);
router.post('/activity-templates', activityTemplateController.create);
router.put('/activity-templates/:id', activityTemplateController.update);
router.delete('/activity-templates/:id', activityTemplateController.delete);

// Daily Schedules
router.get('/daily-schedules', dailyScheduleController.getAll);
router.get('/daily-schedules/templates', dailyScheduleController.getTemplates);
router.get('/daily-schedules/week', dailyScheduleController.getWeekSchedule);
router.get('/daily-schedules/by-group-date', dailyScheduleController.getByGroupAndDate);
router.get('/daily-schedules/:id', dailyScheduleController.getById);
router.post('/daily-schedules', dailyScheduleController.create);
router.put('/daily-schedules/:id', dailyScheduleController.update);
router.put('/daily-schedules/:id/blocks', dailyScheduleController.updateBlocks);
router.delete('/daily-schedules/:id', dailyScheduleController.delete);
router.post('/daily-schedules/copy-week', dailyScheduleController.copyFromPreviousWeek);

export default router;
