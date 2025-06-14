import { FastifyReply } from 'fastify';

import { HTTP_STATUS } from '@api/constants/http';
import { PaginationResult } from '@api/utils/database-helpers';

// ===== TYPES =====

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedSuccessResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  meta?: Record<string, unknown>;
}

export interface CreatedResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface NoContentResponse {
  success: true;
}

// ===== SUCCESS RESPONSES =====

export function successResponse<T>(
  reply: FastifyReply,
  data: T,
  meta?: Record<string, unknown>,
): FastifyReply {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };

  return reply.code(HTTP_STATUS.OK).send(response);
}

export function createdResponse<T>(reply: FastifyReply, data: T, message?: string): FastifyReply {
  const response: CreatedResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };

  return reply.code(HTTP_STATUS.CREATED).send(response);
}

export function noContentResponse(reply: FastifyReply): FastifyReply {
  return reply.code(HTTP_STATUS.NO_CONTENT).send();
}

export function acceptedResponse(
  reply: FastifyReply,
  message: string,
  taskId?: string,
): FastifyReply {
  return reply.code(HTTP_STATUS.ACCEPTED).send({
    success: true,
    message,
    ...(taskId ? { taskId } : {}),
  });
}

// ===== PAGINATED RESPONSE =====

export function paginatedResponse<T>(
  reply: FastifyReply,
  result: PaginationResult<T>,
  meta?: Record<string, unknown>,
): FastifyReply {
  const response: PaginatedSuccessResponse<T> = {
    success: true,
    data: result.data,
    pagination: result.pagination,
    ...(meta ? { meta } : {}),
  };

  return reply.code(HTTP_STATUS.OK).send(response);
}

// ===== RESPONSE HEADERS =====

export function addPaginationHeaders(
  reply: FastifyReply,
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
): void {
  reply.headers({
    'X-Page': pagination.page.toString(),
    'X-Page-Size': pagination.limit.toString(),
    'X-Total-Count': pagination.total.toString(),
    'X-Total-Pages': pagination.totalPages.toString(),
  });
}

export function addCacheHeaders(
  reply: FastifyReply,
  options: {
    maxAge?: number;
    sMaxAge?: number;
    mustRevalidate?: boolean;
    private?: boolean;
  } = {},
): void {
  const directives: string[] = [];

  if (options.private) {
    directives.push('private');
  } else {
    directives.push('public');
  }

  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`);
  }

  if (options.sMaxAge !== undefined) {
    directives.push(`s-maxage=${options.sMaxAge}`);
  }

  if (options.mustRevalidate) {
    directives.push('must-revalidate');
  }

  reply.header('Cache-Control', directives.join(', '));
}

export function addSecurityHeaders(reply: FastifyReply): void {
  reply.headers({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  });
}

// ===== RESPONSE TRANSFORMERS =====

export function transformToApiResponse<T>(
  data: T,
  options: {
    meta?: Record<string, unknown>;
    fields?: string[];
  } = {},
): SuccessResponse<T> {
  let transformedData = data;

  // Field filtering
  if (options.fields && typeof data === 'object' && data !== null) {
    const filtered: Record<string, unknown> = {};
    for (const field of options.fields) {
      if (field in data) {
        filtered[field] = (data as Record<string, unknown>)[field];
      }
    }
    transformedData = filtered as T;
  }

  return {
    success: true,
    data: transformedData,
    ...(options.meta ? { meta: options.meta } : {}),
  };
}

// ===== RESPONSE HELPERS =====

export function sendFile(
  reply: FastifyReply,
  buffer: Buffer,
  filename: string,
  contentType: string,
): FastifyReply {
  return reply
    .header('Content-Type', contentType)
    .header('Content-Disposition', `attachment; filename="${filename}"`)
    .send(buffer);
}

export function sendJSON(reply: FastifyReply, data: unknown, pretty = false): FastifyReply {
  if (pretty) {
    return reply
      .header('Content-Type', 'application/json; charset=utf-8')
      .send(JSON.stringify(data, null, 2));
  }
  return reply.send(data);
}

// ===== CONDITIONAL RESPONSES =====

export function notModifiedResponse(reply: FastifyReply): FastifyReply {
  return reply.code(HTTP_STATUS.NOT_MODIFIED).send();
}

export function conditionalResponse<T>(
  reply: FastifyReply,
  data: T,
  etag: string,
  lastModified?: Date,
): FastifyReply {
  reply.header('ETag', etag);

  if (lastModified) {
    reply.header('Last-Modified', lastModified.toUTCString());
  }

  const ifNoneMatch = reply.request.headers['if-none-match'];
  const ifModifiedSince = reply.request.headers['if-modified-since'];

  if (ifNoneMatch === etag) {
    return notModifiedResponse(reply);
  }

  if (ifModifiedSince && lastModified) {
    const clientDate = new Date(ifModifiedSince);
    if (clientDate >= lastModified) {
      return notModifiedResponse(reply);
    }
  }

  return successResponse(reply, data);
}
