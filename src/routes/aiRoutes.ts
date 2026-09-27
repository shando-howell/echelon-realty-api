import { Router } from 'express';
import { aiController } from '../controllers/aiController.js';

const router = Router();

// Standard AI chat route
router.post('/chat', aiController.chat);

// Implementing SSE stream route
router.post('/chat/stream', aiController.streamChat)

export default router;