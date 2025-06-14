# Security Best Practices - USA Presence Calculator API

This document outlines the security measures implemented in the API and best practices for maintaining security.

## Overview

The API follows defense-in-depth principles with multiple layers of security controls to protect user data and prevent common web vulnerabilities.

## Authentication & Authorization

### JWT Implementation

- **Access tokens**: 15-minute expiry to limit exposure window
- **Refresh tokens**: 30-day expiry with rotation on use
- **Token storage**: Never store tokens in localStorage; use httpOnly cookies or secure mobile storage
- **Session tracking**: IP address and user-agent validation for anomaly detection

### Authentication Methods

1. **Passkeys (WebAuthn)**: Passwordless authentication using biometric/hardware keys
2. **Magic Links**: Time-limited (15min), one-time use email links
3. **Rate limiting**: 3 attempts per 15-minute window for magic links

### Best Practices

- Always validate JWT signatures and expiry
- Implement token rotation to prevent replay attacks
- Use secure random generators for session IDs
- Log authentication events for audit trails

## Input Validation & Sanitization

### Zod Schema Validation

All inputs are validated using strict Zod schemas from the shared package:

```typescript
// All schemas use .strict() mode to reject extra properties
const schema = z.object({...}).strict();
```

### Protection Against Common Attacks

#### SQL Injection

- **Parameterized queries**: All database queries use Drizzle ORM with proper parameter binding
- **No string concatenation**: Never build SQL queries with user input
- **Schema validation**: Input types are enforced before reaching database layer

#### Cross-Site Scripting (XSS)

- **Content Security Policy**: Strict CSP headers via Helmet
- **Input validation**: Regex patterns for formatted fields (dates, UUIDs)
- **Output encoding**: React automatically escapes rendered content
- **JSON responses**: API returns JSON, not HTML

#### Prototype Pollution

- **Strict schemas**: `.strict()` mode rejects unknown properties
- **No object spreading**: Controlled property assignment
- **Validated types**: Only expected properties are processed

## Security Headers

### Helmet Configuration

```typescript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

### Key Headers

- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **Referrer-Policy**: no-referrer (privacy protection)
- **Strict-Transport-Security**: HSTS with 1-year max-age

## Rate Limiting

### Global Rate Limits

- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 5 requests per minute (stricter for sensitive operations)
- **Sync endpoints**: 20 requests per minute (higher for legitimate sync needs)

### Implementation

```typescript
{
  global: true,
  max: 100,
  timeWindow: '1 minute',
  allowList: ['127.0.0.1'], // Localhost exempt for development
}
```

## Data Protection

### Encryption at Rest

- **Database**: SQLite with encryption via SQLCipher (when enabled)
- **Sensitive fields**: Additional field-level encryption for PII
- **Backup encryption**: All backups are encrypted before storage

### Encryption in Transit

- **HTTPS only**: Enforce TLS 1.2+ in production
- **Certificate pinning**: Recommended for mobile app
- **Secure WebSocket**: WSS for real-time features

## Error Handling

### Safe Error Messages

- **Production**: Generic error messages to prevent information leakage
- **Development**: Detailed errors for debugging
- **Sensitive data masking**: Redact tokens, passwords, and PII from logs

### Error Response Format

```json
{
  "error": {
    "message": "Invalid request",
    "code": "VALIDATION_ERROR",
    "requestId": "correlation-id"
  }
}
```

## Monitoring & Alerting

### Security Events to Monitor

1. **Failed authentication attempts**: Track by IP and user
2. **Rate limit violations**: Potential DoS attempts
3. **Invalid token usage**: Possible token theft
4. **Unusual sync patterns**: Data exfiltration attempts
5. **Error rate spikes**: Potential security scanning

### Metrics Endpoints

- **/metrics**: Prometheus metrics (protect in production)
- **/health**: Basic health check (public)
- **/health/detailed**: Detailed health with auth required

## CORS Configuration

### Allowed Origins

- **Development**: http://localhost:\*
- **Production**: Explicit whitelist of allowed domains
- **Credentials**: Only when explicitly needed

### Best Practices

- Never use wildcard (\*) origins in production
- Validate Origin header on sensitive endpoints
- Use preflight caching to reduce overhead

## Database Security

### SQLite Specific

- **WAL mode**: Better concurrency and crash recovery
- **Foreign keys**: Enforced for referential integrity
- **Prepared statements**: Always use parameterized queries
- **File permissions**: Restrict database file access

### Backup Security

- **Encrypted backups**: Use age encryption for backup files
- **Retention policy**: Delete old backups after 30 days
- **Access logging**: Track who accesses backups

## Development Security

### Environment Variables

- **Validation**: Use Zod to validate all env vars at startup
- **Secrets**: Never commit secrets to version control
- **Rotation**: Implement secret rotation procedures
- **.env.example**: Document all required variables

### Dependencies

- **Regular updates**: Use `pnpm audit` to check for vulnerabilities
- **Lock file**: Always commit pnpm-lock.yaml
- **Minimal dependencies**: Audit and remove unused packages
- **Security patches**: Apply patches promptly

## Deployment Security

### Production Hardening

1. **Remove development endpoints**: Disable Swagger UI if not needed
2. **Environment validation**: Ensure all required secrets are set
3. **Health checks**: Implement readiness and liveness probes
4. **Graceful shutdown**: Properly close connections
5. **Resource limits**: Set memory and CPU limits

### Security Checklist

- [ ] All secrets rotated from development
- [ ] HTTPS enforced with valid certificates
- [ ] Rate limiting configured appropriately
- [ ] Monitoring and alerting active
- [ ] Backup encryption verified
- [ ] Access logs enabled
- [ ] Security headers verified
- [ ] CORS properly configured

## Incident Response

### Preparation

1. **Logging**: Centralized, searchable, and retained for 90 days
2. **Alerting**: Real-time alerts for security events
3. **Runbooks**: Documented procedures for common incidents
4. **Contact list**: Security team contacts readily available

### Response Steps

1. **Identify**: Detect and confirm the incident
2. **Contain**: Isolate affected systems
3. **Investigate**: Determine scope and impact
4. **Remediate**: Fix vulnerabilities and patch systems
5. **Recover**: Restore normal operations
6. **Learn**: Post-mortem and improve defenses

## Regular Security Tasks

### Daily

- Review authentication failure logs
- Check rate limit violations
- Monitor error rates

### Weekly

- Review access logs for anomalies
- Check for dependency updates
- Verify backup integrity

### Monthly

- Rotate secrets and API keys
- Review user permissions
- Update security documentation
- Run security scanning tools

### Quarterly

- Penetration testing
- Security training updates
- Incident response drills
- Architecture security review

## Compliance Considerations

### GDPR (if applicable)

- **Data minimization**: Only collect necessary data
- **Right to deletion**: Implement data purge capabilities
- **Data portability**: Export user data in standard format
- **Privacy by design**: Security built into architecture

### HIPAA (if health data involved)

- **Encryption**: Required for data at rest and in transit
- **Access controls**: Role-based with audit trails
- **Business Associate Agreements**: Required for third parties
- **Incident reporting**: 60-day breach notification

## Security Tools & Resources

### Recommended Tools

- **OWASP ZAP**: Web application security scanner
- **SQLMap**: SQL injection testing (use responsibly)
- **Burp Suite**: Comprehensive security testing
- **npm audit**: Dependency vulnerability scanning

### Useful Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Fastify Security](https://www.fastify.io/docs/latest/Reference/Security/)
- [SQLite Security](https://www.sqlite.org/security.html)

## Contact

For security concerns or to report vulnerabilities:

- Email: security@[your-domain].com
- Use PGP encryption for sensitive reports
- Follow responsible disclosure practices

---

Last Updated: January 2025
