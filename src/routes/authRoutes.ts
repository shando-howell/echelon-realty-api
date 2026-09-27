import { Router } from 'express';
import { authController } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register (create a new agent with a hashed password)
router.post('/register', authController.register);

// POST /api/auth/login (authenticate an agent and return a JWT)
router.post('/login', authController.login);
router.post('/logout', authController.logout);

export default router;