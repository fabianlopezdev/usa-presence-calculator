import { FastifyPluginAsync } from 'fastify';

import { BODY_LIMITS } from '@api/constants/body-limits';
import { authenticateUser } from '@api/middleware/auth';
import { handleSyncPull, handleSyncPush } from '@api/routes/sync-handlers';
import { syncPullSchema, syncPushSchema } from '@api/routes/sync-schemas';

// eslint-disable-next-line @typescript-eslint/require-await
const syncRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication to all sync routes
  fastify.addHook('onRequest', authenticateUser);

  // POST /sync/pull - Pull data from server
  fastify.post('/sync/pull', {
    schema: syncPullSchema,
    handler: handleSyncPull,
    bodyLimit: BODY_LIMITS.SYNC_PULL,
  });

  // POST /sync/push - Push data to server
  fastify.post('/sync/push', {
    schema: syncPushSchema,
    handler: handleSyncPush,
    bodyLimit: BODY_LIMITS.SYNC_PUSH,
  });
};

export default syncRoutes;
