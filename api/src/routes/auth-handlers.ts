import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import { AUTH_ERRORS } from '@api/constants/auth';
import { HTTP_STATUS } from '@api/constants/http';
import { PasskeyService } from '@api/services/passkey';
import { MagicLinkService } from '@api/services/magic-link';
import { SessionService } from '@api/services/session';
import { handleAuthError } from '@api/utils/auth-error-handler';

// Request/Response schemas
export const PasskeyRegisterOptionsSchema = z.object({
  userId: z.string().uuid(),
});

export const PasskeyRegisterVerifySchema = z.object({
  userId: z.string().uuid(),
  response: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      attestationObject: z.string(),
      authenticatorData: z.string().optional(),
      transports: z.array(z.enum(['ble', 'hybrid', 'internal', 'nfc', 'usb'])).optional(),
      publicKeyAlgorithm: z.number().optional(),
      publicKey: z.string().optional(),
    }),
    authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
    clientExtensionResults: z.object({}).passthrough(),
    type: z.literal('public-key'),
  }),
  expectedChallenge: z.string(),
  expectedOrigin: z.string(),
});

export const PasskeyAuthenticateOptionsSchema = z.object({
  userId: z.string().uuid().optional(),
});

export const PasskeyAuthenticateVerifySchema = z.object({
  response: z.object({
    id: z.string(),
    rawId: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      authenticatorData: z.string(),
      signature: z.string(),
      userHandle: z.string().optional(),
    }),
    authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
    clientExtensionResults: z.object({}).passthrough(),
    type: z.literal('public-key'),
  }),
  expectedChallenge: z.string(),
  expectedOrigin: z.string(),
});

export const MagicLinkSendSchema = z.object({
  email: z.string().email(),
});

export const MagicLinkVerifySchema = z.object({
  token: z.string().length(64),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

// Route handler functions
export async function handlePasskeyRegisterOptions(
  request: FastifyRequest,
  reply: FastifyReply,
  passkeyService: PasskeyService,
): Promise<FastifyReply> {
  try {
    const validatedBody = PasskeyRegisterOptionsSchema.parse(request.body);
    const options = await passkeyService.generateRegistrationOptions(validatedBody.userId);
    return reply.code(HTTP_STATUS.OK).send(options);
  } catch (error) {
    return handleAuthError(error, reply);
  }
}

export async function handlePasskeyRegisterVerify(
  request: FastifyRequest,
  reply: FastifyReply,
  passkeyService: PasskeyService,
): Promise<FastifyReply> {
  try {
    const validatedBody = PasskeyRegisterVerifySchema.parse(request.body);
    const verification = await passkeyService.verifyRegistrationResponse(
      validatedBody.userId,
      validatedBody.response,
      validatedBody.expectedChallenge,
      validatedBody.expectedOrigin,
    );
    return reply.code(HTTP_STATUS.OK).send({ verified: verification.verified });
  } catch (error) {
    return handleAuthError(error, reply);
  }
}

export async function handlePasskeyAuthenticateOptions(
  request: FastifyRequest,
  reply: FastifyReply,
  passkeyService: PasskeyService,
): Promise<FastifyReply> {
  try {
    const validatedBody = PasskeyAuthenticateOptionsSchema.parse(request.body);
    const options = await passkeyService.generateAuthenticationOptions(validatedBody.userId);
    return reply.code(HTTP_STATUS.OK).send(options);
  } catch (error) {
    return handleAuthError(error, reply);
  }
}

export async function handlePasskeyAuthenticateVerify(
  request: FastifyRequest,
  reply: FastifyReply,
  passkeyService: PasskeyService,
  sessionService: SessionService,
): Promise<FastifyReply> {
  try {
    const validatedBody = PasskeyAuthenticateVerifySchema.parse(request.body);
    const result = await passkeyService.verifyAuthenticationResponse(
      validatedBody.response,
      validatedBody.expectedChallenge,
      validatedBody.expectedOrigin,
    );

    if (!result.verified || !result.userId) {
      return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
        error: AUTH_ERRORS.PASSKEY_AUTHENTICATION_FAILED,
      });
    }

    const session = await sessionService.createSession(
      result.userId,
      request.ip,
      request.headers['user-agent'],
    );

    return reply.code(HTTP_STATUS.OK).send({
      verified: true,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  } catch (error) {
    return handleAuthError(error, reply);
  }
}

export async function handleMagicLinkSend(
  request: FastifyRequest,
  reply: FastifyReply,
  magicLinkService: MagicLinkService,
): Promise<FastifyReply> {
  try {
    const validatedBody = MagicLinkSendSchema.parse(request.body);
    const result = await magicLinkService.sendMagicLink(validatedBody.email);
    return reply.code(HTTP_STATUS.OK).send(result);
  } catch (error) {
    return handleAuthError(error, reply);
  }
}

export async function handleMagicLinkVerify(
  request: FastifyRequest,
  reply: FastifyReply,
  magicLinkService: MagicLinkService,
  sessionService: SessionService,
): Promise<FastifyReply> {
  try {
    const validatedBody = MagicLinkVerifySchema.parse(request.body);
    const result = await magicLinkService.verifyMagicLink(validatedBody.token);

    if (!result.verified) {
      return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
        error: AUTH_ERRORS.INVALID_TOKEN,
      });
    }

    const session = await sessionService.createSession(
      result.userId,
      request.ip,
      request.headers['user-agent'],
    );

    return reply.code(HTTP_STATUS.OK).send({
      verified: true,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  } catch (error) {
    return handleAuthError(error, reply);
  }
}

export async function handleGetSession(
  request: FastifyRequest,
  reply: FastifyReply,
  sessionService: SessionService,
): Promise<FastifyReply> {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(HTTP_STATUS.UNAUTHORIZED).send({
        error: AUTH_ERRORS.UNAUTHORIZED,
      });
    }

    const token = authHeader.substring(7);
    const payload = sessionService.verifyAccessToken(token);
    const sessionInfo = sessionService.getSessionInfo(payload.userId);

    return reply.code(HTTP_STATUS.OK).send(sessionInfo);
  } catch (error) {
    return handleAuthError(error, reply);
  }
}

export async function handleRefreshToken(
  request: FastifyRequest,
  reply: FastifyReply,
  sessionService: SessionService,
): Promise<FastifyReply> {
  try {
    const validatedBody = RefreshTokenSchema.parse(request.body);
    const session = await sessionService.refreshSession(validatedBody.refreshToken);

    return reply.code(HTTP_STATUS.OK).send({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  } catch (error) {
    return handleAuthError(error, reply);
  }
}

export async function handleLogout(
  request: FastifyRequest,
  reply: FastifyReply,
  sessionService: SessionService,
): Promise<FastifyReply> {
  try {
    const validatedBody = RefreshTokenSchema.parse(request.body);
    await sessionService.invalidateSession(validatedBody.refreshToken);
    return reply.code(HTTP_STATUS.NO_CONTENT).send();
  } catch {
    // Even if logout fails, we return success
    return reply.code(HTTP_STATUS.NO_CONTENT).send();
  }
}
