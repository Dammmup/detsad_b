import express from 'express';
import { login, validateToken, logout } from './controller';
import { getCurrentUser } from './current-user-controller';

const router = express.Router();

// User login
router.post('/login', login);

// Validate token
router.get('/validate', validateToken);

// Logout
router.post('/logout', logout);

// Get current user info
router.get('/current-user', getCurrentUser);

export default router;