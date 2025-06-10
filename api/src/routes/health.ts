import { FastifyPluginCallback } from 'fastify';

import { HTTP_STATUS } from '@api/constants/http';

const healthRoute: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Returns the current health status of the API',
        response: {
          [HTTP_STATUS.OK]: {
            description: 'Successful response',
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['ok'],
                description: 'Health status',
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'Current server timestamp in ISO format',
              },
            },
            required: ['status', 'timestamp'],
          },
        },
      },
    },
    () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  );
  done();
};

export default healthRoute;
