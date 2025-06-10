import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { UserProfileSchema } from '@usa-presence/shared/schemas/user';
import { USER_VALIDATION } from '@usa-presence/shared/constants/validation-messages';
import { HTTP_STATUS } from '@api/constants/http';
import { AUTH_ERRORS } from '@api/constants/auth';
import { getDatabase } from '@api/db/connection';
import { users } from '@api/db/schema';
import { authenticateUser } from '@api/middleware/auth';

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
  const greenCardDateObj = new Date(greenCardDate);
  const now = new Date();

  // Check if date is in the future
  if (greenCardDateObj > now) {
    return USER_VALIDATION.GREEN_CARD_FUTURE;
  }

  // Check if date is more than 20 years ago
  const twentyYearsAgo = new Date();
  twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
  if (greenCardDateObj < twentyYearsAgo) {
    return USER_VALIDATION.GREEN_CARD_TOO_OLD;
  }

  return null;
}

async function getUserProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = request.user?.userId;
  if (!userId) {
    return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
      error: AUTH_ERRORS.UNAUTHORIZED,
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

async function updateUserProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const userId = request.user?.userId;
  if (!userId) {
    return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
      error: AUTH_ERRORS.UNAUTHORIZED,
    });
  }

  // Validate request body
  const parseResult = validateUpdateProfileData(request.body);
  if (!parseResult.success) {
    return reply.code(HTTP_STATUS.BAD_REQUEST).send({
      error: {
        message: 'Invalid request body',
        details: parseResult.error.errors,
      },
    });
  }

  const validatedData = parseResult.data;

  // Validate greenCardDate if provided
  if (validatedData.greenCardDate) {
    const validationError = validateGreenCardDate(validatedData.greenCardDate);
    if (validationError) {
      return reply.code(HTTP_STATUS.BAD_REQUEST).send({
        error: {
          message: validationError,
        },
      });
    }
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

const userRoutes: FastifyPluginAsync = (fastify) => {
  // GET /users/profile
  fastify.get('/profile', {
    preValidation: [authenticateUser],
    handler: getUserProfile,
  });

  // PATCH /users/profile
  fastify.patch('/profile', {
    preValidation: [authenticateUser],
    handler: updateUserProfile,
  });

  return Promise.resolve();
};

export default userRoutes;
