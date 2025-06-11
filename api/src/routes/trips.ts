import { FastifyPluginAsync } from 'fastify';

import { authenticateUser } from '@api/middleware/auth';
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
    preValidation: [authenticateUser],
    schema: tripSchemas.createTrip,
    handler: createTripHandler,
  });

  // Get all trips for user
  server.get('/', {
    preValidation: [authenticateUser],
    schema: tripSchemas.getTrips,
    handler: getAllTripsHandler,
  });

  // Get single trip
  server.get('/:id', {
    preValidation: [authenticateUser],
    schema: tripSchemas.getTrip,
    handler: getTripByIdHandler,
  });

  // Update trip
  server.patch('/:id', {
    preValidation: [authenticateUser],
    schema: tripSchemas.updateTrip,
    handler: updateTripHandler,
  });

  // Delete trip (soft delete)
  server.delete('/:id', {
    preValidation: [authenticateUser],
    schema: tripSchemas.deleteTrip,
    handler: deleteTripHandler,
  });

  return Promise.resolve();
};
