import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { USER_VALIDATION, UserProfileSchema } from '@usa-presence/shared';
import { HTTP_STATUS } from '@api/constants/http';
import { getDatabase } from '@api/db/connection';
import { users } from '@api/db/schema';

// Helper functions
function formatUserResponse(user: typeof users.$inferSelect): {
  id: string;
  email: string;
  greenCardDate: string;
  eligibilityCategory: string;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: user.id,
    email: user.email,
    greenCardDate: user.greenCardDate,
    eligibilityCategory: user.eligibilityCategory,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function validateGreenCardDate(greenCardDate: string): string | null {
  // First check if the date string is valid
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(greenCardDate)) {
    return 'Invalid date format';
  }

  const [year, month, day] = greenCardDate.split('-').map(Number);
  const greenCardDateObj = new Date(year, month - 1, day);

  // Check if the date components match (to catch invalid dates like Feb 29 on non-leap years)
  if (
    greenCardDateObj.getFullYear() !== year ||
    greenCardDateObj.getMonth() !== month - 1 ||
    greenCardDateObj.getDate() !== day
  ) {
    return 'Invalid date';
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Check if date is in the future
  if (greenCardDateObj > now) {
    return USER_VALIDATION.GREEN_CARD_FUTURE;
  }

  // Check if date is more than 20 years ago (exclusive)
  const twentyYearsAgo = new Date();
  twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
  twentyYearsAgo.setHours(0, 0, 0, 0);

  if (greenCardDateObj < twentyYearsAgo) {
    return USER_VALIDATION.GREEN_CARD_TOO_OLD;
  }

  return null;
}

async function getUserProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // User is guaranteed to exist with requireAuth, but TypeScript doesn't know that
  const userId = request.user?.userId;
  if (!userId) {
    // This should never happen with requireAuth, but satisfies TypeScript
    return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      error: 'Authentication state error',
    });
  }

  const db = getDatabase();
  const user = db.select().from(users).where(eq(users.id, userId)).get();

  if (!user) {
    return reply.code(HTTP_STATUS.NOT_FOUND).send({
      error: 'User not found',
    });
  }

  return reply.code(HTTP_STATUS.OK).send(formatUserResponse(user));
}

function validateUpdateProfileData(
  data: unknown,
): z.SafeParseReturnType<unknown, { greenCardDate?: string; eligibilityCategory?: string }> {
  const UpdateProfileSchema = UserProfileSchema.pick({
    greenCardDate: true,
    eligibilityCategory: true,
  }).partial();

  return UpdateProfileSchema.safeParse(data);
}

function performUserUpdate(
  userId: string,
  validatedData: { greenCardDate?: string; eligibilityCategory?: string },
): typeof users.$inferSelect | undefined {
  const db = getDatabase();

  return db
    .update(users)
    .set({
      ...(validatedData.greenCardDate && { greenCardDate: validatedData.greenCardDate }),
      ...(validatedData.eligibilityCategory && {
        eligibilityCategory: validatedData.eligibilityCategory as 'three_year' | 'five_year',
      }),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, userId))
    .returning()
    .get();
}

function validateProfileUpdatePayload(
  parseResult: z.SafeParseReturnType<
    unknown,
    { greenCardDate?: string; eligibilityCategory?: string }
  >,
  reply: FastifyReply,
): { greenCardDate?: string; eligibilityCategory?: string } | null {
  if (!parseResult.success) {
    reply.code(HTTP_STATUS.BAD_REQUEST).send({
      error: {
        message: 'Invalid request body',
        details: parseResult.error.errors,
      },
    });
    return null;
  }

  const validatedData = parseResult.data;

  // Check if at least one field is provided
  if (!validatedData.greenCardDate && !validatedData.eligibilityCategory) {
    reply.code(HTTP_STATUS.BAD_REQUEST).send({
      error: {
        message: 'At least one field must be provided for update',
      },
    });
    return null;
  }

  // Validate greenCardDate if provided
  if (validatedData.greenCardDate) {
    const validationError = validateGreenCardDate(validatedData.greenCardDate);
    if (validationError) {
      reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: validationError,
        },
      });
      return null;
    }
  }

  return validatedData;
}

async function updateUserProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // User is guaranteed to exist with requireAuth, but TypeScript doesn't know that
  const userId = request.user?.userId;
  if (!userId) {
    // This should never happen with requireAuth, but satisfies TypeScript
    return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
      error: 'Authentication state error',
    });
  }

  // Validate request body
  const parseResult = validateUpdateProfileData(request.body);
  const validatedData = validateProfileUpdatePayload(parseResult, reply);
  if (!validatedData) {
    return;
  }

  // Update user profile
  const updatedUser = performUserUpdate(userId, validatedData);

  if (!updatedUser) {
    return reply.code(HTTP_STATUS.NOT_FOUND).send({
      error: 'User not found',
    });
  }

  return reply.code(HTTP_STATUS.OK).send(formatUserResponse(updatedUser));
}

// Schema definitions
const userProfileResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    greenCardDate: { type: 'string' },
    eligibilityCategory: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' },
  },
};

const badRequestResponseSchema = {
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
};

const getUserProfileSchema = {
  tags: ['users'],
  summary: 'Get user profile',
  description: 'Get the profile information for the authenticated user',
  security: [{ bearerAuth: [] }],
  response: {
    [HTTP_STATUS.OK]: {
      description: 'User profile retrieved successfully',
      ...userProfileResponseSchema,
    },
    [HTTP_STATUS.NOT_FOUND]: {
      description: 'User not found',
      ...errorResponseSchema,
    },
    [HTTP_STATUS.UNAUTHORIZED]: {
      description: 'Authentication required',
      ...errorResponseSchema,
    },
  },
};

const updateUserProfileSchema = {
  tags: ['users'],
  summary: 'Update user profile',
  description: 'Update the profile information for the authenticated user',
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    properties: {
      greenCardDate: { type: 'string', format: 'date' },
      eligibilityCategory: { type: 'string', enum: ['three_year', 'five_year'] },
    },
  },
  response: {
    [HTTP_STATUS.OK]: {
      description: 'User profile updated successfully',
      ...userProfileResponseSchema,
    },
    [HTTP_STATUS.BAD_REQUEST]: {
      description: 'Invalid request body',
      ...badRequestResponseSchema,
    },
    [HTTP_STATUS.NOT_FOUND]: {
      description: 'User not found',
      ...errorResponseSchema,
    },
    [HTTP_STATUS.UNAUTHORIZED]: {
      description: 'Authentication required',
      ...errorResponseSchema,
    },
  },
};

const userRoutes: FastifyPluginAsync = (fastify) => {
  // GET /users/profile
  fastify.get('/profile', {
    preHandler: fastify.requireAuth,
    handler: getUserProfile,
    schema: getUserProfileSchema,
  });

  // PATCH /users/profile
  fastify.patch('/profile', {
    preHandler: fastify.requireAuth,
    handler: updateUserProfile,
    schema: updateUserProfileSchema,
  });

  return Promise.resolve();
};

export default userRoutes;
