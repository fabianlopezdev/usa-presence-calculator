import { FastifyCorsOptions } from '@fastify/cors';

import { config } from '@api/config/env';

export const CORS_CONFIG: Record<'PRODUCTION' | 'DEVELOPMENT' | 'TEST', FastifyCorsOptions> = {
  PRODUCTION: {
    origin: (origin, callback) => {
      const allowedOrigins = config.CORS_ORIGIN.split(',').map((o) => o.trim());

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: config.CORS_CREDENTIALS,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
    strictPreflight: true,
    optionsSuccessStatus: 204,
  },
  DEVELOPMENT: {
    origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: config.CORS_CREDENTIALS,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-Total-Count', 'X-Page-Count'],
    maxAge: 3600, // 1 hour
    strictPreflight: false,
  },
  TEST: {
    origin: true,
    credentials: config.CORS_CREDENTIALS,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    strictPreflight: false,
  },
};