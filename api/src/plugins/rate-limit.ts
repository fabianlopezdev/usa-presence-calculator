import fastifyRateLimit from '@fastify/rate-limit';
import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { RATE_LIMIT_CONFIG, RATE_LIMIT_MESSAGES } from '@api/constants/rate-limit';

// Key generator that uses IP address and optionally user ID for authenticated requests
function keyGenerator(request: FastifyRequest): string {
  const userId = request.user?.userId;
  // Get IP from x-forwarded-for header or fall back to request.ip
  const forwardedFor = request.headers['x-forwarded-for'] as string;
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip;

  // For authenticated users, include user ID in the key
  if (userId) {
    return `${ip}-${userId}`;
  }

  // For unauthenticated requests, use IP only
  return ip;
}

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  // Register the global rate limit plugin
  await fastify.register(fastifyRateLimit, {
    global: true,
    max: RATE_LIMIT_CONFIG.GLOBAL.MAX_REQUESTS,
    timeWindow: RATE_LIMIT_CONFIG.GLOBAL.TIME_WINDOW,
    keyGenerator,
    errorResponseBuilder: (_request, _context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: RATE_LIMIT_MESSAGES.TOO_MANY_REQUESTS,
    }),
  });
};

export default fp(rateLimitPlugin, {
  name: 'rate-limit',
});
