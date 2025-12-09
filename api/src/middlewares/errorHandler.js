export const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Erro de validação',
                details: err.errors
            }
        });
    }

    if (err.code === 'P2002') {
        return res.status(409).json({
            error: {
                code: 'RESOURCE_CONFLICT',
                message: 'Recurso já existe',
                details: err.meta
            }
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: {
                code: 'RESOURCE_NOT_FOUND',
                message: 'Recurso não encontrado'
            }
        });
    }

    return res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Erro interno do servidor'
        }
    });
};
