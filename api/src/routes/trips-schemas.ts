import { zodToJsonSchema } from 'zod-to-json-schema';

import { TripCreateSchema, TripSchema, TripUpdateSchema } from '@usa-presence/shared';
import { AUTH_ERRORS } from '@api/constants/auth';
import { HTTP_STATUS } from '@api/constants/http';
import { TRIPS_API_MESSAGES } from '@api/constants/trips';

const tripJsonSchema = zodToJsonSchema(TripSchema);
const tripCreateJsonSchema = zodToJsonSchema(TripCreateSchema);
const tripUpdateJsonSchema = zodToJsonSchema(TripUpdateSchema);

interface JsonSchemaObject {
  properties?: Record<string, unknown>;
}

// Extract just the properties for response schemas
const tripProperties = (tripJsonSchema as JsonSchemaObject).properties || {};

export const tripSchemas = {
  createTrip: {
    tags: ['trips'],
    summary: 'Create a new trip',
    description: 'Create a new trip record for the authenticated user',
    security: [{ bearerAuth: [] }],
    body: tripCreateJsonSchema,
    response: {
      [HTTP_STATUS.CREATED]: {
        description: 'Trip created successfully',
        type: 'object',
        properties: tripProperties,
      },
      [HTTP_STATUS.BAD_REQUEST]: {
        description: 'Invalid trip data',
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: { type: 'array' },
            },
          },
        },
      },
      [HTTP_STATUS.UNAUTHORIZED]: {
        description: 'Authentication required',
        type: 'object',
        properties: {
          error: { type: 'string', example: AUTH_ERRORS.INVALID_TOKEN },
        },
      },
    },
  },

  getTrips: {
    tags: ['trips'],
    summary: 'Get all trips',
    description:
      'Get all trips for the authenticated user, sorted by departure date (newest first)',
    security: [{ bearerAuth: [] }],
    response: {
      [HTTP_STATUS.OK]: {
        description: 'List of user trips',
        type: 'array',
        items: {
          type: 'object',
          properties: tripProperties,
        },
      },
      [HTTP_STATUS.UNAUTHORIZED]: {
        description: 'Authentication required',
        type: 'object',
        properties: {
          error: { type: 'string', example: AUTH_ERRORS.INVALID_TOKEN },
        },
      },
    },
  },

  getTrip: {
    tags: ['trips'],
    summary: 'Get a specific trip',
    description: 'Get a specific trip by ID for the authenticated user',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Trip ID' },
      },
    },
    response: {
      [HTTP_STATUS.OK]: {
        description: 'Trip details',
        type: 'object',
        properties: tripProperties,
      },
      [HTTP_STATUS.NOT_FOUND]: {
        description: 'Trip not found',
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: TRIPS_API_MESSAGES.TRIP_NOT_FOUND },
            },
          },
        },
      },
      [HTTP_STATUS.UNAUTHORIZED]: {
        description: 'Authentication required',
        type: 'object',
        properties: {
          error: { type: 'string', example: AUTH_ERRORS.INVALID_TOKEN },
        },
      },
    },
  },

  updateTrip: {
    tags: ['trips'],
    summary: 'Update a trip',
    description: 'Update a specific trip for the authenticated user',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Trip ID' },
      },
    },
    body: tripUpdateJsonSchema,
    response: {
      [HTTP_STATUS.OK]: {
        description: 'Trip updated successfully',
        type: 'object',
        properties: tripProperties,
      },
      [HTTP_STATUS.BAD_REQUEST]: {
        description: 'Invalid update data',
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              details: { type: 'array' },
            },
          },
        },
      },
      [HTTP_STATUS.NOT_FOUND]: {
        description: 'Trip not found',
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: TRIPS_API_MESSAGES.TRIP_NOT_FOUND },
            },
          },
        },
      },
      [HTTP_STATUS.UNAUTHORIZED]: {
        description: 'Authentication required',
        type: 'object',
        properties: {
          error: { type: 'string', example: AUTH_ERRORS.INVALID_TOKEN },
        },
      },
    },
  },

  deleteTrip: {
    tags: ['trips'],
    summary: 'Delete a trip',
    description: 'Soft delete a specific trip for the authenticated user',
    security: [{ bearerAuth: [] }],
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Trip ID' },
      },
    },
    response: {
      [HTTP_STATUS.NO_CONTENT]: {
        description: 'Trip deleted successfully',
      },
      [HTTP_STATUS.NOT_FOUND]: {
        description: 'Trip not found',
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: TRIPS_API_MESSAGES.TRIP_NOT_FOUND },
            },
          },
        },
      },
      [HTTP_STATUS.UNAUTHORIZED]: {
        description: 'Authentication required',
        type: 'object',
        properties: {
          error: { type: 'string', example: AUTH_ERRORS.INVALID_TOKEN },
        },
      },
    },
  },
};
