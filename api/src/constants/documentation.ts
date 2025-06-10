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
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Auth',
      description: 'Authentication endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Trips',
      description: 'Trip management endpoints',
    },
    {
      name: 'Settings',
      description: 'User settings endpoints',
    },
    {
      name: 'Sync',
      description: 'Data synchronization endpoints',
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
