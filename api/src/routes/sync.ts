import { FastifyPluginAsync } from 'fastify';

import { BODY_LIMITS } from '@api/constants/body-limits';
import { handleSyncPull, handleSyncPush } from '@api/routes/sync-handlers';
import { syncPullSchema, syncPushSchema } from '@api/routes/sync-schemas';

// eslint-disable-next-line @typescript-eslint/require-await
const syncRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /sync/pull - Pull data from server
  fastify.post('/sync/pull', {
    preHandler: fastify.requireAuth,
    schema: syncPullSchema,
    handler: handleSyncPull,
    bodyLimit: BODY_LIMITS.SYNC_PULL,
  });

  // POST /sync/push - Push data to server
  fastify.post('/sync/push', {
    preHandler: fastify.requireAuth,
    schema: syncPushSchema,
    handler: handleSyncPush,
    bodyLimit: BODY_LIMITS.SYNC_PUSH,
  });
};

export default syncRoutes;
