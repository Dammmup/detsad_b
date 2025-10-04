import { Application } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kindergarten Management System API',
      version: '1.0.0',
      description: 'API documentation for the Kindergarten Management System',
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: 'https://your-production-url.com',
        description: 'Production server',
      },
    ],
  },
  apis: [
    './src/routes/*.ts', 
    './src/controllers/*.ts',
    './src/models/*.ts'
  ], // files containing annotations for the openapi spec
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  
  console.log('📚 Swagger documentation available at http://localhost:8080/api-docs');
};

export default specs;