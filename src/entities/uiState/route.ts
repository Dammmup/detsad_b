import { Router } from 'express';
import { saveUIState, getLastUIState, getUIStateById } from './controller';

const router = Router();

// Маршрут для сохранения состояния UI
router.post('/ui-state', saveUIState);

// Маршрут для получения последнего состояния UI по sessionId
router.get('/ui-state/session/:sessionId', getLastUIState);

// Маршрут для получения состояния UI по ID
router.get('/ui-state/:id', getUIStateById);

export default router;