import express from 'express';
import { login, validateToken, logout } from './controller';
import { getCurrentUser } from './current-user-controller';

const router = express.Router();


router.post('/login', login);


router.get('/validate', validateToken);


router.post('/logout', logout);


router.get('/current-user', getCurrentUser);

export default router;