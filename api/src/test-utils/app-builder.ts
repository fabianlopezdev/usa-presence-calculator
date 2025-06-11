import { FastifyInstance } from 'fastify';

import { buildApp } from '@api/app';

/**
 * Build a test app instance
 * This is a wrapper around buildApp for test consistency
 */
export async function buildTestApp(): Promise<FastifyInstance> {
  return buildApp();
}
