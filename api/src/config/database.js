import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    errorFormat: 'pretty',
});

// Tratamento de erros de conexão
prisma.$connect()
    .then(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Conectado ao banco de dados');
        }
    })
    .catch((error) => {
        console.error('❌ Erro ao conectar ao banco de dados:', error);
        process.exit(1);
    });

// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

export default prisma;
