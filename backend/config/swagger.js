const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GameLivo API Documentation',
      version: '1.0.0',
      description:
        'Official REST API & Real-time Game Engine documentation for GameLivo (Ludo, Chess, Uno, Snake & Ladder, Chidiya Udd, Esto).',
      contact: {
        name: 'GameLivo Engineering',
        email: 'api@gamelivo.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
      {
        url: 'https://api.gamelivo.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' },
          },
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_1' },
            name: { type: 'string', example: 'Aarav Kapoor' },
            username: { type: 'string', example: 'aarav.kapoor' },
            email: { type: 'string', example: 'aarav@email.com' },
            mobile: { type: 'string', example: '+91 98765 43210' },
            level: { type: 'integer', example: 14 },
            coins: { type: 'integer', example: 2480 },
            rank: { type: 'integer', example: 128 },
            winRate: { type: 'integer', example: 61 },
          },
        },
        BlockedUser: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_blocked_99' },
            name: { type: 'string', example: 'Rohan Verma' },
            username: { type: 'string', example: 'rohan_rage_quit' },
            blockedAt: { type: 'string', example: '2026-08-14T10:30:00Z' },
            reason: { type: 'string', example: 'Toxic chat behavior' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './server.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
