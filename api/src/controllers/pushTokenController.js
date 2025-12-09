import prisma from '../config/database.js';

/**
 * @swagger
 * /push-tokens:
 *   post:
 *     summary: Registra ou atualiza um token de push notification
 *     tags: [Push Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - plataforma
 *             properties:
 *               token:
 *                 type: string
 *               plataforma:
 *                 type: string
 *                 enum: [ios, android, web]
 *     responses:
 *       201:
 *         description: Token registrado com sucesso
 */
export const registerPushToken = async (req, res) => {
    try {
        const { token, plataforma } = req.body;
        const userId = req.userId;

        // Validação básica
        if (!token || !plataforma) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Token e plataforma são obrigatórios'
                }
            });
        }

        const plataformasValidas = ['ios', 'android', 'web'];
        if (!plataformasValidas.includes(plataforma)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Plataforma inválida'
                }
            });
        }

        // Verifica se o token já existe
        const tokenExistente = await prisma.pushToken.findUnique({
            where: { token }
        });

        if (tokenExistente) {
            // Atualiza o token existente
            const pushToken = await prisma.pushToken.update({
                where: { token },
                data: {
                    usuarioId: userId,
                    plataforma,
                    ativo: true
                }
            });

            return res.json({
                message: 'Token atualizado com sucesso',
                pushToken
            });
        }

        // Cria novo token
        const pushToken = await prisma.pushToken.create({
            data: {
                usuarioId: userId,
                token,
                plataforma
            }
        });

        return res.status(201).json({
            message: 'Token registrado com sucesso',
            pushToken
        });
    } catch (error) {
        console.error('Erro ao registrar push token:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao registrar push token'
            }
        });
    }
};

/**
 * @swagger
 * /push-tokens/{id}:
 *   delete:
 *     summary: Remove um token de push notification
 *     tags: [Push Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token removido com sucesso
 */
export const deletePushToken = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const pushToken = await prisma.pushToken.findUnique({
            where: { id }
        });

        if (!pushToken) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Token não encontrado'
                }
            });
        }

        // Verifica se o token pertence ao usuário
        if (pushToken.usuarioId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para remover este token'
                }
            });
        }

        await prisma.pushToken.delete({
            where: { id }
        });

        return res.json({
            message: 'Token removido com sucesso'
        });
    } catch (error) {
        console.error('Erro ao remover push token:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao remover push token'
            }
        });
    }
};
