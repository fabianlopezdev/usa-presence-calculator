import { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';

import { CSP_REPORT_ENDPOINT } from '@api/constants/helmet';
import { HTTP_STATUS } from '@api/constants/http';

// CSP violation report schema based on W3C spec
const CspReportSchema = z.object({
  'csp-report': z.object({
    'blocked-uri': z.string().optional(),
    'column-number': z.number().optional(),
    'document-uri': z.string(),
    'line-number': z.number().optional(),
    'original-policy': z.string().optional(),
    referrer: z.string().optional(),
    'script-sample': z.string().optional(),
    'source-file': z.string().optional(),
    'violated-directive': z.string(),
  }),
});

const cspReportRoute: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.post(
    CSP_REPORT_ENDPOINT,
    {
      schema: {
        hide: true, // Don't show in Swagger docs
      },
    },
    async (request, reply) => {
      try {
        // Parse and validate the CSP report
        const report = CspReportSchema.parse(request.body);

        // Log the violation for monitoring
        fastify.log.warn(
          {
            cspViolation: report['csp-report'],
            userAgent: request.headers['user-agent'],
            ip: request.ip,
          },
          'CSP violation reported',
        );

        // In production, you might want to:
        // - Send to a monitoring service
        // - Store in a database for analysis
        // - Alert on repeated violations

        return reply.code(HTTP_STATUS.NO_CONTENT).send();
      } catch (error) {
        // Invalid report format, just acknowledge it
        fastify.log.debug({ error, body: request.body }, 'Invalid CSP report format');
        return reply.code(HTTP_STATUS.NO_CONTENT).send();
      }
    },
  );

  done();
};

export default cspReportRoute;
