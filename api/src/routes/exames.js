import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import {
    createExame,
    listExames,
    getExame,
    updateExame,
    deleteExame
} from '../controllers/exameController.js';

const router = express.Router();

// Todas as rotas de exames requerem autenticação
router.use(authMiddleware);

router.post('/', createExame);
router.get('/', listExames);
router.get('/:id', getExame);
router.put('/:id', updateExame);
router.delete('/:id', deleteExame);

export default router;
