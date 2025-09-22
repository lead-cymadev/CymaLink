// src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CymaLink API',
      version: '1.0.0',
      description: 'Documentación de la API para el sistema de monitoreo CymaLink.',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_BACKEND_SHORT_URL || 'http://localhost:8000',
        description: 'Servidor de Desarrollo',
      },
    ],
    // ✅ Define el esquema de seguridad para JWT (Bearer Token)
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // ✅ Apunta a los archivos que contienen las definiciones de tus rutas
  apis: ['./src/routes/*.ts'], 
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };