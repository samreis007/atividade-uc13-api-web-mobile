import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra um novo paciente
 *     tags: [Auth]
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
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
export const register = async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        // Validação básica
        if (!nome || !email || !senha) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Nome, email e senha são obrigatórios'
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
                perfil: 'PACIENTE'
            },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                criadoEm: true
            }
        });

        return res.status(201).json({
            message: 'Usuário criado com sucesso',
            usuario
        });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao registrar usuário'
            }
        });
    }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza login no sistema
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
export const login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Validação básica
        if (!email || !senha) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Email e senha são obrigatórios'
                }
            });
        }

        // Busca o usuário
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!usuario) {
            return res.status(401).json({
                error: {
                    code: 'AUTH_INVALID_CREDENTIALS',
                    message: 'Email ou senha inválidos'
                }
            });
        }

        // Verifica se o usuário está ativo
        if (!usuario.ativo) {
            return res.status(401).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Usuário inativo'
                }
            });
        }

        // Verifica a senha
        const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);

        if (!senhaValida) {
            return res.status(401).json({
                error: {
                    code: 'AUTH_INVALID_CREDENTIALS',
                    message: 'Email ou senha inválidos'
                }
            });
        }

        // Gera o access token
        const accessToken = jwt.sign(
            { id: usuario.id, perfil: usuario.perfil },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
        );

        // Gera o refresh token (opcional)
        const refreshToken = jwt.sign(
            { id: usuario.id },
            process.env.REFRESH_JWT_SECRET || process.env.JWT_SECRET,
            { expiresIn: process.env.REFRESH_JWT_EXPIRES_IN || '7d' }
        );

        return res.json({
            message: 'Login realizado com sucesso',
            accessToken,
            refreshToken,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil
            }
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao fazer login'
            }
        });
    }
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renova o access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *       401:
 *         description: Token inválido
 */
export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Refresh token é obrigatório'
                }
            });
        }

        // Verifica o refresh token
        jwt.verify(
            refreshToken,
            process.env.REFRESH_JWT_SECRET || process.env.JWT_SECRET,
            async (err, decoded) => {
                if (err) {
                    return res.status(401).json({
                        error: {
                            code: 'AUTH_INVALID_TOKEN',
                            message: 'Refresh token inválido ou expirado'
                        }
                    });
                }

                // Busca o usuário
                const usuario = await prisma.usuario.findUnique({
                    where: { id: decoded.id }
                });

                if (!usuario || !usuario.ativo) {
                    return res.status(401).json({
                        error: {
                            code: 'AUTH_FORBIDDEN',
                            message: 'Usuário não encontrado ou inativo'
                        }
                    });
                }

                // Gera novo access token
                const accessToken = jwt.sign(
                    { id: usuario.id, perfil: usuario.perfil },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
                );

                return res.json({
                    message: 'Token renovado com sucesso',
                    accessToken
                });
            }
        );
    } catch (error) {
        console.error('Erro ao renovar token:', error);
        return res.status(500).json({
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Erro ao renovar token'
            }
        });
    }
};
