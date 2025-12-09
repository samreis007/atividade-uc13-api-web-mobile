import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Importar rotas
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import consultaRoutes from './routes/consultas.js';
import exameRoutes from './routes/exames.js';
import resultadoRoutes from './routes/resultados.js';
import pushTokenRoutes from './routes/pushTokens.js';

const app = express();
const PORT = process.env.PORT || 3333;

// Middlewares globais
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true
}));

// Rota de health check
app.get('/', (req, res) => {
    res.json({
        message: 'Clínica API - Sistema de Consultas e Exames',
        version: '1.0.0',
        status: 'online'
    });
});

// Documentação Swagger
if (process.env.SWAGGER_ENABLED === 'true') {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Clínica API - Documentação'
    }));
    console.log('📚 Swagger disponível em http://localhost:' + PORT + '/docs');
}

// Rotas da API
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/consultas', consultaRoutes);
app.use('/exames', exameRoutes);
app.use('/resultados', resultadoRoutes);
app.use('/push-tokens', pushTokenRoutes);

// Rota 404
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: 'Rota não encontrada'
        }
    });
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀 Servidor rodando na porta ' + PORT);
    console.log('🏥 Clínica API - Sistema de Consultas e Exames');
    console.log('📍 Ambiente:', process.env.NODE_ENV || 'development');
});

export default app;
