import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: {
                    code: 'AUTH_MISSING_TOKEN',
                    message: 'Token de autenticação não fornecido'
                }
            });
        }

        const parts = authHeader.split(' ');

        if (parts.length !== 2) {
            return res.status(401).json({
                error: {
                    code: 'AUTH_INVALID_TOKEN',
                    message: 'Formato de token inválido'
                }
            });
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({
                error: {
                    code: 'AUTH_INVALID_TOKEN',
                    message: 'Token mal formatado'
                }
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    error: {
                        code: 'AUTH_INVALID_TOKEN',
                        message: 'Token inválido ou expirado'
                    }
                });
            }

            req.userId = decoded.id;
            req.userPerfil = decoded.perfil;
            return next();
        });
    } catch (error) {
        return res.status(401).json({
            error: {
                code: 'AUTH_ERROR',
                message: 'Erro na autenticação'
            }
        });
    }
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.userPerfil) {
            return res.status(401).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Usuário não autenticado'
                }
            });
        }

        if (!roles.includes(req.userPerfil)) {
            return res.status(403).json({
                error: {
                    code: 'AUTH_FORBIDDEN',
                    message: 'Você não tem permissão para acessar este recurso'
                }
            });
        }

        next();
    };
};
