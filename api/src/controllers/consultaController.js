import prisma from '../config/database.js';

/**
 * @swagger
 * /consultas:
 *   post:
 *     summary: Cria uma nova consulta
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pacienteId
 *               - medicoId
 *               - dia
 *               - hora
 *             properties:
 *               pacienteId:
 *                 type: string
 *               medicoId:
 *                 type: string
 *               dia:
 *                 type: string
 *                 format: date
 *               hora:
 *                 type: string
 *               detalhes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Consulta criada com sucesso
 */
export const createConsulta = async (req, res) => {
    try {
        const { pacienteId, medicoId, dia, hora, detalhes } = req.body;
        const userPerfil = req.userPerfil;
        const userId = req.userId;

        // Validação básica
        if (!pacienteId || !medicoId || !dia || !hora) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Paciente, médico, dia e hora são obrigatórios'
                }
            });
        }

        // Verifica permissões
        if (userPerfil === 'PACIENTE' && pacienteId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você só pode agendar consultas para si mesmo'
                }
            });
        }

        // Verifica se o médico existe e é médico
        const medico = await prisma.usuario.findUnique({
            where: { id: medicoId }
        });

        if (!medico || medico.perfil !== 'MEDICO') {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Médico inválido'
                }
            });
        }

        // Verifica se o paciente existe
        const paciente = await prisma.usuario.findUnique({
            where: { id: pacienteId }
        });

        if (!paciente) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Paciente não encontrado'
                }
            });
        }

        // Cria dataHora combinando dia e hora
        const [horas, minutos] = hora.split(':');
        const dataHora = new Date(dia);
        dataHora.setHours(parseInt(horas), parseInt(minutos), 0, 0);

        // Verifica se já existe consulta no mesmo horário para o médico
        const consultaExistente = await prisma.consulta.findFirst({
            where: {
                medicoId,
                dataHora
            }
        });

        if (consultaExistente) {
            return res.status(409).json({
                error: {
                    code: 'SLOT_UNAVAILABLE',
                    message: 'Horário indisponível para este médico'
                }
            });
        }

        // Cria a consulta
        const consulta = await prisma.consulta.create({
            data: {
                pacienteId,
                medicoId,
                dia: new Date(dia),
                hora,
                dataHora,
                detalhes
            },
            include: {
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
                        nome: true,
                        email: true
                    }
                }
            }
        });

        return res.status(201).json({
            message: 'Consulta agendada com sucesso',
            consulta
        });
    } catch (error) {
        console.error('Erro ao criar consulta:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao criar consulta'
            }
        });
    }
};

/**
 * @swagger
 * /consultas:
 *   get:
 *     summary: Lista consultas
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de consultas
 */
export const listConsultas = async (req, res) => {
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
        // Admin e Atendente veem todas

        const consultas = await prisma.consulta.findMany({
            where: whereClause,
            include: {
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
                        nome: true,
                        email: true
                    }
                }
            },
            orderBy: {
                dataHora: 'asc'
            }
        });

        return res.json({ consultas });
    } catch (error) {
        console.error('Erro ao listar consultas:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao listar consultas'
            }
        });
    }
};

/**
 * @swagger
 * /consultas/{id}:
 *   get:
 *     summary: Busca uma consulta por ID
 *     tags: [Consultas]
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
 *         description: Consulta encontrada
 */
export const getConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const userPerfil = req.userPerfil;
        const userId = req.userId;

        const consulta = await prisma.consulta.findUnique({
            where: { id },
            include: {
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
                        nome: true,
                        email: true
                    }
                }
            }
        });

        if (!consulta) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Consulta não encontrada'
                }
            });
        }

        // Verifica permissões
        if (userPerfil === 'PACIENTE' && consulta.pacienteId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para acessar esta consulta'
                }
            });
        }

        if (userPerfil === 'MEDICO' && consulta.medicoId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para acessar esta consulta'
                }
            });
        }

        return res.json({ consulta });
    } catch (error) {
        console.error('Erro ao buscar consulta:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao buscar consulta'
            }
        });
    }
};

/**
 * @swagger
 * /consultas/{id}:
 *   put:
 *     summary: Atualiza uma consulta
 *     tags: [Consultas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [AGENDADA, REALIZADA, CANCELADA, NAO_COMPARECEU]
 *               detalhes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Consulta atualizada com sucesso
 */
export const updateConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, detalhes } = req.body;
        const userPerfil = req.userPerfil;
        const userId = req.userId;

        const consulta = await prisma.consulta.findUnique({
            where: { id }
        });

        if (!consulta) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Consulta não encontrada'
                }
            });
        }

        // Verifica permissões
        if (userPerfil === 'PACIENTE' && consulta.pacienteId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para atualizar esta consulta'
                }
            });
        }

        if (userPerfil === 'MEDICO' && consulta.medicoId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para atualizar esta consulta'
                }
            });
        }

        const dadosAtualizacao = {};
        if (status) {
            const statusValidos = ['AGENDADA', 'REALIZADA', 'CANCELADA', 'NAO_COMPARECEU'];
            if (!statusValidos.includes(status)) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Status inválido'
                    }
                });
            }
            dadosAtualizacao.status = status;
        }
        if (detalhes !== undefined) dadosAtualizacao.detalhes = detalhes;

        const consultaAtualizada = await prisma.consulta.update({
            where: { id },
            data: dadosAtualizacao,
            include: {
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
                        nome: true,
                        email: true
                    }
                }
            }
        });

        return res.json({
            message: 'Consulta atualizada com sucesso',
            consulta: consultaAtualizada
        });
    } catch (error) {
        console.error('Erro ao atualizar consulta:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao atualizar consulta'
            }
        });
    }
};

/**
 * @swagger
 * /consultas/{id}:
 *   delete:
 *     summary: Cancela uma consulta
 *     tags: [Consultas]
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
 *         description: Consulta cancelada com sucesso
 */
export const deleteConsulta = async (req, res) => {
    try {
        const { id } = req.params;
        const userPerfil = req.userPerfil;
        const userId = req.userId;

        const consulta = await prisma.consulta.findUnique({
            where: { id }
        });

        if (!consulta) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Consulta não encontrada'
                }
            });
        }

        // Verifica permissões
        if (userPerfil === 'PACIENTE' && consulta.pacienteId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para cancelar esta consulta'
                }
            });
        }

        // Atualiza o status para CANCELADA ao invés de deletar
        const consultaCancelada = await prisma.consulta.update({
            where: { id },
            data: { status: 'CANCELADA' }
        });

        return res.json({
            message: 'Consulta cancelada com sucesso',
            consulta: consultaCancelada
        });
    } catch (error) {
        console.error('Erro ao cancelar consulta:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao cancelar consulta'
            }
        });
    }
};
