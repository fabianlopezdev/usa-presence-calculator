import { FastifyPluginAsync } from 'fastify';

import { BODY_LIMITS } from '@api/constants/body-limits';
import { tripSchemas } from './trips-schemas';
import {
  createTripHandler,
  getAllTripsHandler,
  getTripByIdHandler,
  updateTripHandler,
  deleteTripHandler,
} from './trips-handlers';

export const tripRoutes: FastifyPluginAsync = (server) => {
  // Create trip
  server.post('/', {
    preHandler: server.requireAuth,
    schema: tripSchemas.createTrip,
    handler: createTripHandler,
    bodyLimit: BODY_LIMITS.API_SMALL,
  });

  // Get all trips for user
  server.get('/', {
    preHandler: server.requireAuth,
    schema: tripSchemas.getTrips,
    handler: getAllTripsHandler,
  });

  // Get single trip
  server.get('/:id', {
    preHandler: server.requireAuth,
    schema: tripSchemas.getTrip,
    handler: getTripByIdHandler,
  });

  // Update trip
  server.patch('/:id', {
    preHandler: server.requireAuth,
    schema: tripSchemas.updateTrip,
    handler: updateTripHandler,
    bodyLimit: BODY_LIMITS.API_SMALL,
  });

  // Delete trip (soft delete)
  server.delete('/:id', {
    preHandler: server.requireAuth,
    schema: tripSchemas.deleteTrip,
    handler: deleteTripHandler,
  });

  return Promise.resolve();
};
