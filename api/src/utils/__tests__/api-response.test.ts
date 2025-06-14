/* eslint-disable @typescript-eslint/unbound-method */
import { FastifyReply, FastifyRequest } from 'fastify';
import { describe, expect, it, vi } from 'vitest';

import { HTTP_STATUS } from '@api/constants/http';
import {
  acceptedResponse,
  addCacheHeaders,
  addPaginationHeaders,
  conditionalResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
  successResponse,
  transformToApiResponse,
} from '@api/utils/api-response';

describe('API Response Utilities', () => {
  const createMockReply = (): FastifyReply => {
    const reply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      headers: vi.fn().mockReturnThis(),
      request: {
        headers: {},
      } as unknown as FastifyRequest,
    } as unknown as FastifyReply;
    return reply;
  };

  describe('successResponse', () => {
    it('should send success response with data', () => {
      const reply = createMockReply();
      const data = { id: '123', name: 'Test' };

      successResponse(reply, data);

      expect(reply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should include meta when provided', () => {
      const reply = createMockReply();
      const data = { id: '123' };
      const meta = { version: '1.0' };

      successResponse(reply, data, meta);

      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data,
        meta,
      });
    });
  });

  describe('createdResponse', () => {
    it('should send created response', () => {
      const reply = createMockReply();
      const data = { id: '123', name: 'New Item' };

      createdResponse(reply, data);

      expect(reply.code).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should include message when provided', () => {
      const reply = createMockReply();
      const data = { id: '123' };
      const message = 'Resource created successfully';

      createdResponse(reply, data, message);

      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data,
        message,
      });
    });
  });

  describe('noContentResponse', () => {
    it('should send no content response', () => {
      const reply = createMockReply();

      noContentResponse(reply);

      expect(reply.code).toHaveBeenCalledWith(HTTP_STATUS.NO_CONTENT);
      expect(reply.send).toHaveBeenCalledWith();
    });
  });

  describe('acceptedResponse', () => {
    it('should send accepted response with message', () => {
      const reply = createMockReply();
      const message = 'Task queued for processing';

      acceptedResponse(reply, message);

      expect(reply.code).toHaveBeenCalledWith(HTTP_STATUS.ACCEPTED);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        message,
      });
    });

    it('should include taskId when provided', () => {
      const reply = createMockReply();
      const message = 'Task queued';
      const taskId = 'task-123';

      acceptedResponse(reply, message, taskId);

      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        message,
        taskId,
      });
    });
  });

  describe('paginatedResponse', () => {
    it('should send paginated response', () => {
      const reply = createMockReply();
      const result = {
        data: [{ id: '1' }, { id: '2' }],
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      };

      paginatedResponse(reply, result);

      expect(reply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    });
  });

  describe('addPaginationHeaders', () => {
    it('should add pagination headers', () => {
      const reply = createMockReply();
      const pagination = {
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
      };

      addPaginationHeaders(reply, pagination);

      expect(reply.headers).toHaveBeenCalledWith({
        'X-Page': '2',
        'X-Page-Size': '20',
        'X-Total-Count': '100',
        'X-Total-Pages': '5',
      });
    });
  });

  describe('addCacheHeaders', () => {
    it('should add public cache headers', () => {
      const reply = createMockReply();

      addCacheHeaders(reply, {
        maxAge: 3600,
        sMaxAge: 86400,
      });

      expect(reply.header).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=3600, s-maxage=86400',
      );
    });

    it('should add private cache headers', () => {
      const reply = createMockReply();

      addCacheHeaders(reply, {
        private: true,
        maxAge: 1800,
        mustRevalidate: true,
      });

      expect(reply.header).toHaveBeenCalledWith(
        'Cache-Control',
        'private, max-age=1800, must-revalidate',
      );
    });
  });

  describe('transformToApiResponse', () => {
    it('should transform data to API response', () => {
      const data = { id: '123', name: 'Test', secret: 'hidden' };
      const result = transformToApiResponse(data);

      expect(result).toEqual({
        success: true,
        data,
      });
    });

    it('should filter fields when specified', () => {
      const data = { id: '123', name: 'Test', secret: 'hidden' };
      const result = transformToApiResponse(data, {
        fields: ['id', 'name'],
      });

      expect(result).toEqual({
        success: true,
        data: { id: '123', name: 'Test' },
      });
    });
  });

  describe('conditionalResponse', () => {
    it('should return 304 when ETag matches', () => {
      const reply = createMockReply();
      reply.request.headers['if-none-match'] = '"123abc"';

      const data = { id: '1' };
      conditionalResponse(reply, data, '"123abc"');

      expect(reply.code).toHaveBeenCalledWith(HTTP_STATUS.NOT_MODIFIED);
    });

    it('should return data when ETag does not match', () => {
      const reply = createMockReply();
      reply.request.headers['if-none-match'] = '"old-etag"';

      const data = { id: '1' };
      conditionalResponse(reply, data, '"new-etag"');

      expect(reply.header).toHaveBeenCalledWith('ETag', '"new-etag"');
      expect(reply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });

    it('should handle Last-Modified header', () => {
      const reply = createMockReply();
      const lastModified = new Date('2024-01-01');
      reply.request.headers['if-modified-since'] = new Date('2023-12-01').toUTCString();

      const data = { id: '1' };
      conditionalResponse(reply, data, '"etag"', lastModified);

      expect(reply.header).toHaveBeenCalledWith('Last-Modified', lastModified.toUTCString());
      expect(reply.code).toHaveBeenCalledWith(HTTP_STATUS.OK);
    });
  });
});
