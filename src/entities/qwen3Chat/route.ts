import { Router } from 'express';
import { sendMessage } from './controller';

const router = Router();

router.post('/chat', sendMessage);

export default router;