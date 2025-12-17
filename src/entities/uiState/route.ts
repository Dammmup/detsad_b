import { Router } from 'express';
import { saveUIState, getLastUIState, getUIStateById } from './controller';

const router = Router();


router.post('/ui-state', saveUIState);


router.get('/ui-state/session/:sessionId', getLastUIState);


router.get('/ui-state/:id', getUIStateById);

export default router;