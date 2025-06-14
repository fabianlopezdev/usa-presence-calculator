export const SWAGGER_CONFIG = {
  TITLE: 'USA Presence Calculator API',
  DESCRIPTION:
    'Backend API for USA Presence Calculator - Track physical presence for naturalization eligibility',
  VERSION: '1.0.0',
  OPENAPI_VERSION: '3.0.3',
  UI_ROUTE: '/documentation',
  DEVELOPMENT_URL: 'http://localhost:3000',
  PRODUCTION_URL: 'https://api.usapresencecalculator.com',
  TAGS: [
    {
      name: 'health',
      description: 'Health check endpoints',
    },
    {
      name: 'auth',
      description: 'Authentication endpoints',
    },
    {
      name: 'sync',
      description: 'Data synchronization endpoints',
    },
    {
      name: 'trips',
      description: 'Trip management endpoints',
    },
    {
      name: 'users',
      description: 'User management endpoints (includes settings)',
    },
  ],
} as const;

export const API_RESPONSES = {
  UNAUTHORIZED: {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  BAD_REQUEST: {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  NOT_FOUND: {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  INTERNAL_ERROR: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
} as const;
