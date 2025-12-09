import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import {
    registerPushToken,
    deletePushToken
} from '../controllers/pushTokenController.js';

const router = express.Router();

// Todas as rotas de push tokens requerem autenticação
router.use(authMiddleware);

router.post('/', registerPushToken);
router.delete('/:id', deletePushToken);

export default router;
