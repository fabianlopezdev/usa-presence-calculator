import { API_PATHS } from '@usa-presence/shared';

export const CSP_REPORT_ENDPOINT = '/csp-report';
export const CSP_REPORT_FULL_PATH = API_PATHS.CSP_REPORT;

export const HELMET_CONFIG = {
  PRODUCTION: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        upgradeInsecureRequests: [],
        reportUri: [CSP_REPORT_FULL_PATH],
      },
    },
    hsts: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny' as const,
    },
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin' as const,
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: 'same-origin' as const },
    crossOriginResourcePolicy: { policy: 'same-origin' as const },
  },
  DEVELOPMENT: {
    contentSecurityPolicy: false,
    hsts: false,
    frameguard: {
      action: 'deny' as const,
    },
    hidePoweredBy: true,
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin' as const,
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  },
} as const;
