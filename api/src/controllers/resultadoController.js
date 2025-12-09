import prisma from '../config/database.js';

/**
 * @swagger
 * /resultados:
 *   post:
 *     summary: Cria um novo resultado de exame
 *     tags: [Resultados]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exameId
 *               - pacienteId
 *               - medicoId
 *             properties:
 *               exameId:
 *                 type: string
 *               pacienteId:
 *                 type: string
 *               medicoId:
 *                 type: string
 *               detalhes:
 *                 type: string
 *               arquivoUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Resultado criado com sucesso
 */
export const createResultado = async (req, res) => {
    try {
        const { exameId, pacienteId, medicoId, detalhes, arquivoUrl } = req.body;
        const userPerfil = req.userPerfil;

        // Validação básica
        if (!exameId || !pacienteId || !medicoId) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Exame, paciente e médico são obrigatórios'
                }
            });
        }

        // Apenas médicos e admins podem criar resultados
        if (!['MEDICO', 'ADMIN'].includes(userPerfil)) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Apenas médicos e administradores podem criar resultados'
                }
            });
        }

        // Verifica se o exame existe
        const exame = await prisma.exame.findUnique({
            where: { id: exameId }
        });

        if (!exame) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Exame não encontrado'
                }
            });
        }

        // Cria o resultado
        const resultado = await prisma.resultadoExame.create({
            data: {
                exameId,
                pacienteId,
                medicoId,
                detalhes,
                arquivoUrl
            },
            include: {
                exame: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                paciente: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                },
                medico: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
        });

        return res.status(201).json({
            message: 'Resultado criado com sucesso',
            resultado
        });
    } catch (error) {
        console.error('Erro ao criar resultado:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao criar resultado'
            }
        });
    }
};

/**
 * @swagger
 * /resultados:
 *   get:
 *     summary: Lista resultados de exames
 *     tags: [Resultados]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de resultados
 */
export const listResultados = async (req, res) => {
    try {
        const userPerfil = req.userPerfil;
        const userId = req.userId;

        let whereClause = {};

        // Filtro por perfil
        if (userPerfil === 'PACIENTE') {
            whereClause.pacienteId = userId;
        } else if (userPerfil === 'MEDICO') {
            whereClause.medicoId = userId;
        }
        // Admin vê todos

        const resultados = await prisma.resultadoExame.findMany({
            where: whereClause,
            include: {
                exame: {
                    select: {
                        id: true,
                        nome: true,
                        dia: true,
                        hora: true
                    }
                },
                paciente: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                },
                medico: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            },
            orderBy: {
                publicadoEm: 'desc'
            }
        });

        return res.json({ resultados });
    } catch (error) {
        console.error('Erro ao listar resultados:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao listar resultados'
            }
        });
    }
};

/**
 * @swagger
 * /resultados/{id}:
 *   get:
 *     summary: Busca um resultado por ID
 *     tags: [Resultados]
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
 *         description: Resultado encontrado
 */
export const getResultado = async (req, res) => {
    try {
        const { id } = req.params;
        const userPerfil = req.userPerfil;
        const userId = req.userId;

        const resultado = await prisma.resultadoExame.findUnique({
            where: { id },
            include: {
                exame: {
                    select: {
                        id: true,
                        nome: true,
                        dia: true,
                        hora: true
                    }
                },
                paciente: {
                    select: {
                        id: true,
                        nome: true,
                        email: true
                    }
                },
                medico: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
        });

        if (!resultado) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Resultado não encontrado'
                }
            });
        }

        // Verifica permissões
        if (userPerfil === 'PACIENTE' && resultado.pacienteId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para acessar este resultado'
                }
            });
        }

        if (userPerfil === 'MEDICO' && resultado.medicoId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para acessar este resultado'
                }
            });
        }

        return res.json({ resultado });
    } catch (error) {
        console.error('Erro ao buscar resultado:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao buscar resultado'
            }
        });
    }
};
