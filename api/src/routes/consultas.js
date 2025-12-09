import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import {
    createConsulta,
    listConsultas,
    getConsulta,
    updateConsulta,
    deleteConsulta
} from '../controllers/consultaController.js';

const router = express.Router();

// Todas as rotas de consultas requerem autenticação
router.use(authMiddleware);

router.post('/', createConsulta);
router.get('/', listConsultas);
router.get('/:id', getConsulta);
router.put('/:id', updateConsulta);
router.delete('/:id', deleteConsulta);

export default router;
