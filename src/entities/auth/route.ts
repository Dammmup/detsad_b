import express from 'express';
import { login, validateToken, logout } from './controller';

const router = express.Router();

// User login
router.post('/login', login);

// Validate token
router.get('/validate', validateToken);

// Logout
router.post('/logout', logout);

export default router;