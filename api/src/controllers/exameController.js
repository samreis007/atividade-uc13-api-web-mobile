import prisma from '../config/database.js';

/**
 * @swagger
 * /exames:
 *   post:
 *     summary: Cria um novo exame
 *     tags: [Exames]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - pacienteId
 *               - medicoId
 *               - dia
 *               - hora
 *             properties:
 *               nome:
 *                 type: string
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
 *         description: Exame criado com sucesso
 */
export const createExame = async (req, res) => {
    try {
        const { nome, pacienteId, medicoId, dia, hora, detalhes } = req.body;
        const userPerfil = req.userPerfil;
        const userId = req.userId;

        // Validação básica
        if (!nome || !pacienteId || !medicoId || !dia || !hora) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Nome, paciente, médico, dia e hora são obrigatórios'
                }
            });
        }

        // Verifica permissões
        if (userPerfil === 'PACIENTE' && pacienteId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você só pode agendar exames para si mesmo'
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

        // Verifica se já existe exame no mesmo horário para o médico
        const exameExistente = await prisma.exame.findFirst({
            where: {
                medicoId,
                dataHora
            }
        });

        if (exameExistente) {
            return res.status(409).json({
                error: {
                    code: 'SLOT_UNAVAILABLE',
                    message: 'Horário indisponível para este médico'
                }
            });
        }

        // Cria o exame
        const exame = await prisma.exame.create({
            data: {
                nome,
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
            message: 'Exame agendado com sucesso',
            exame
        });
    } catch (error) {
        console.error('Erro ao criar exame:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao criar exame'
            }
        });
    }
};

/**
 * @swagger
 * /exames:
 *   get:
 *     summary: Lista exames
 *     tags: [Exames]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de exames
 */
export const listExames = async (req, res) => {
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
        // Admin e Atendente veem todos

        const exames = await prisma.exame.findMany({
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

        return res.json({ exames });
    } catch (error) {
        console.error('Erro ao listar exames:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao listar exames'
            }
        });
    }
};

/**
 * @swagger
 * /exames/{id}:
 *   get:
 *     summary: Busca um exame por ID
 *     tags: [Exames]
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
 *         description: Exame encontrado
 */
export const getExame = async (req, res) => {
    try {
        const { id } = req.params;
        const userPerfil = req.userPerfil;
        const userId = req.userId;

        const exame = await prisma.exame.findUnique({
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
                },
                resultados: true
            }
        });

        if (!exame) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Exame não encontrado'
                }
            });
        }

        // Verifica permissões
        if (userPerfil === 'PACIENTE' && exame.pacienteId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para acessar este exame'
                }
            });
        }

        if (userPerfil === 'MEDICO' && exame.medicoId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para acessar este exame'
                }
            });
        }

        return res.json({ exame });
    } catch (error) {
        console.error('Erro ao buscar exame:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao buscar exame'
            }
        });
    }
};

/**
 * @swagger
 * /exames/{id}:
 *   put:
 *     summary: Atualiza um exame
 *     tags: [Exames]
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
 *         description: Exame atualizado com sucesso
 */
export const updateExame = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, detalhes } = req.body;
        const userPerfil = req.userPerfil;
        const userId = req.userId;

        const exame = await prisma.exame.findUnique({
            where: { id }
        });

        if (!exame) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Exame não encontrado'
                }
            });
        }

        // Verifica permissões
        if (userPerfil === 'PACIENTE' && exame.pacienteId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para atualizar este exame'
                }
            });
        }

        if (userPerfil === 'MEDICO' && exame.medicoId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para atualizar este exame'
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

        const exameAtualizado = await prisma.exame.update({
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
            message: 'Exame atualizado com sucesso',
            exame: exameAtualizado
        });
    } catch (error) {
        console.error('Erro ao atualizar exame:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao atualizar exame'
            }
        });
    }
};

/**
 * @swagger
 * /exames/{id}:
 *   delete:
 *     summary: Cancela um exame
 *     tags: [Exames]
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
 *         description: Exame cancelado com sucesso
 */
export const deleteExame = async (req, res) => {
    try {
        const { id } = req.params;
        const userPerfil = req.userPerfil;
        const userId = req.userId;

        const exame = await prisma.exame.findUnique({
            where: { id }
        });

        if (!exame) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Exame não encontrado'
                }
            });
        }

        // Verifica permissões
        if (userPerfil === 'PACIENTE' && exame.pacienteId !== userId) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para cancelar este exame'
                }
            });
        }

        // Atualiza o status para CANCELADA ao invés de deletar
        const exameCancelado = await prisma.exame.update({
            where: { id },
            data: { status: 'CANCELADA' }
        });

        return res.json({
            message: 'Exame cancelado com sucesso',
            exame: exameCancelado
        });
    } catch (error) {
        console.error('Erro ao cancelar exame:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao cancelar exame'
            }
        });
    }
};
