import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Clínica API',
            version: '1.0.0',
            description: 'API para sistema de clínica de consultas e exames',
            contact: {
                name: 'Clínica API Support'
            }
        },
        servers: [
            {
                url: 'http://localhost:3333',
                description: 'Servidor de desenvolvimento'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        tags: [
            {
                name: 'Auth',
                description: 'Autenticação e autorização'
            },
            {
                name: 'Users',
                description: 'Gerenciamento de usuários (Admin)'
            },
            {
                name: 'Consultas',
                description: 'Gerenciamento de consultas'
            },
            {
                name: 'Exames',
                description: 'Gerenciamento de exames'
            },
            {
                name: 'Resultados',
                description: 'Resultados de exames'
            },
            {
                name: 'Push Tokens',
                description: 'Tokens de notificações push'
            }
        ]
    },
    apis: ['./src/controllers/*.js', './src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
