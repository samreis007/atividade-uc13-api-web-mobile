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

// Configuração CORS melhorada para mobile e web
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requisições sem origin (mobile apps, Postman, etc)
        if (!origin) return callback(null, true);

        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
            'http://localhost:3000',  // Web (Next.js)
            'http://localhost:8081',  // Mobile (Expo)
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

// Rota de health check melhorada
app.get('/', (req, res) => {
    res.json({
        name: 'Clínica API - Sistema de Consultas e Exames',
        version: '1.0.0',
        status: 'online',
        timestamp: new Date().toISOString(),
        endpoints: {
            docs: '/docs',
            auth: '/auth',
            users: '/users',
            consultas: '/consultas',
            exames: '/exames',
            resultados: '/resultados',
            pushTokens: '/push-tokens'
        },
        environment: process.env.NODE_ENV || 'development'
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
