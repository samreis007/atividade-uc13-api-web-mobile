import express from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import {
    listUsers,
    createUser,
    getUser,
    updateUser,
    deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// Todas as rotas de usuários requerem autenticação e perfil ADMIN
router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

router.get('/', listUsers);
router.post('/', createUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
