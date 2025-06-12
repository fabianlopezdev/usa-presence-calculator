import { FastifyPluginAsync } from 'fastify';

import { authenticateUser } from '@api/middleware/auth';
import { handleSyncPull, handleSyncPush } from '@api/routes/sync-handlers';
import { syncPullSchema, syncPushSchema } from '@api/routes/sync-schemas';

// eslint-disable-next-line @typescript-eslint/require-await
const syncRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication to all sync routes
  fastify.addHook('onRequest', authenticateUser);

  // Add payload size limit
  fastify.addHook('preValidation', (request, reply, done) => {
    // Check content length
    const contentLength = request.headers['content-length'];
    if (contentLength && parseInt(contentLength, 10) > 1024 * 1024) {
      // 1MB limit
      reply.code(413).send({
        error: {
          message: 'Payload too large',
          code: 'PAYLOAD_TOO_LARGE',
        },
      });
    } else {
      done();
    }
  });

  // POST /sync/pull - Pull data from server
  fastify.post('/sync/pull', {
    schema: syncPullSchema,
    handler: handleSyncPull,
  });

  // POST /sync/push - Push data to server
  fastify.post('/sync/push', {
    schema: syncPushSchema,
    handler: handleSyncPush,
  });
};

export default syncRoutes;
