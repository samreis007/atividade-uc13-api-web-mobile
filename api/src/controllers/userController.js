import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os usuários (admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 *       403:
 *         description: Acesso negado
 */
export const listUsers = async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                ativo: true,
                criadoEm: true,
                atualizadoEm: true
            },
            orderBy: {
                criadoEm: 'desc'
            }
        });

        return res.json({ usuarios });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao listar usuários'
            }
        });
    }
};

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cria um novo usuário (admin)
 *     tags: [Users]
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
 *               - email
 *               - senha
 *               - perfil
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *               perfil:
 *                 type: string
 *                 enum: [ADMIN, PACIENTE, ATENDENTE, MEDICO]
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 */
export const createUser = async (req, res) => {
    try {
        const { nome, email, senha, perfil } = req.body;

        // Validação básica
        if (!nome || !email || !senha || !perfil) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Nome, email, senha e perfil são obrigatórios'
                }
            });
        }

        if (senha.length < 8) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'A senha deve ter no mínimo 8 caracteres'
                }
            });
        }

        const perfisValidos = ['ADMIN', 'PACIENTE', 'ATENDENTE', 'MEDICO'];
        if (!perfisValidos.includes(perfil)) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Perfil inválido'
                }
            });
        }

        // Verifica se o email já existe
        const existingUser = await prisma.usuario.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                error: {
                    code: 'RESOURCE_CONFLICT',
                    message: 'Email já cadastrado'
                }
            });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 10);

        // Cria o usuário
        const usuario = await prisma.usuario.create({
            data: {
                nome,
                email,
                senhaHash,
                perfil
            },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                ativo: true,
                criadoEm: true
            }
        });

        return res.status(201).json({
            message: 'Usuário criado com sucesso',
            usuario
        });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao criar usuário'
            }
        });
    }
};

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Busca um usuário por ID (admin)
 *     tags: [Users]
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
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 */
export const getUser = async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                ativo: true,
                criadoEm: true,
                atualizadoEm: true
            }
        });

        if (!usuario) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Usuário não encontrado'
                }
            });
        }

        return res.json({ usuario });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao buscar usuário'
            }
        });
    }
};

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualiza um usuário (admin)
 *     tags: [Users]
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
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *               perfil:
 *                 type: string
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, senha, perfil, ativo } = req.body;

        // Verifica se o usuário existe
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { id }
        });

        if (!usuarioExistente) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Usuário não encontrado'
                }
            });
        }

        // Prepara os dados para atualização
        const dadosAtualizacao = {};

        if (nome) dadosAtualizacao.nome = nome;
        if (email) dadosAtualizacao.email = email;
        if (perfil) {
            const perfisValidos = ['ADMIN', 'PACIENTE', 'ATENDENTE', 'MEDICO'];
            if (!perfisValidos.includes(perfil)) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Perfil inválido'
                    }
                });
            }
            dadosAtualizacao.perfil = perfil;
        }
        if (typeof ativo === 'boolean') dadosAtualizacao.ativo = ativo;
        if (senha) {
            if (senha.length < 8) {
                return res.status(400).json({
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'A senha deve ter no mínimo 8 caracteres'
                    }
                });
            }
            dadosAtualizacao.senhaHash = await bcrypt.hash(senha, 10);
        }

        // Atualiza o usuário
        const usuario = await prisma.usuario.update({
            where: { id },
            data: dadosAtualizacao,
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                ativo: true,
                atualizadoEm: true
            }
        });

        return res.json({
            message: 'Usuário atualizado com sucesso',
            usuario
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao atualizar usuário'
            }
        });
    }
};

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove um usuário (admin)
 *     tags: [Users]
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
 *         description: Usuário removido com sucesso
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica se o usuário existe
        const usuario = await prisma.usuario.findUnique({
            where: { id }
        });

        if (!usuario) {
            return res.status(404).json({
                error: {
                    code: 'RESOURCE_NOT_FOUND',
                    message: 'Usuário não encontrado'
                }
            });
        }

        // Remove o usuário
        await prisma.usuario.delete({
            where: { id }
        });

        return res.json({
            message: 'Usuário removido com sucesso'
        });
    } catch (error) {
        console.error('Erro ao remover usuário:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao remover usuário'
            }
        });
    }
};
