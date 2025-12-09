import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import {
    createResultado,
    listResultados,
    getResultado
} from '../controllers/resultadoController.js';

const router = express.Router();

// Todas as rotas de resultados requerem autenticação
router.use(authMiddleware);

router.post('/', createResultado);
router.get('/', listResultados);
router.get('/:id', getResultado);

export default router;
