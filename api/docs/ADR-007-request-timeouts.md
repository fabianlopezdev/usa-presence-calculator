# ADR-007: Request Timeout Strategy

## Status

Accepted

## Context

In a production environment, it's crucial to prevent requests from hanging indefinitely. This can lead to:

- Resource exhaustion
- Poor user experience
- Cascading failures
- Difficulty in debugging issues

We need a comprehensive timeout strategy that:

1. Protects server resources
2. Provides good user experience
3. Accommodates different types of operations
4. Is easy to configure and maintain

## Decision

We will implement a multi-layered timeout strategy:

### 1. Server-Level Timeouts

- **Connection Timeout**: 10 seconds - Maximum time to establish a connection
- **Keep-Alive Timeout**: 5 seconds - Maximum idle time for persistent connections
- **Headers Timeout**: 10 seconds - Maximum time to receive complete headers

### 2. Route-Specific Timeouts

Different types of operations require different timeout values:

- **Fast Operations** (5 seconds):

  - Health checks (`/health`, `/health/live`)
  - Metrics endpoint (`/metrics`)
  - Session info (`/auth/session`)
  - Logout (`/auth/logout`)

- **Standard Operations** (15 seconds):

  - Authentication endpoints
  - User profile operations
  - Individual trip CRUD operations
  - Settings updates

- **Long Operations** (60 seconds):

  - Sync pull/push operations
  - Bulk operations
  - Data exports

- **Upload Operations** (120 seconds):
  - File imports
  - Bulk data uploads

### 3. Default Timeout

- All unspecified routes default to 30 seconds

### 4. Implementation Details

- Custom timeout plugin that sets timeouts per route
- Graceful timeout handling with proper error messages
- Automatic cleanup of timeout handlers
- Logging of timeout events for monitoring

### 5. Error Response Format

```json
{
  "error": {
    "message": "Request timeout - the server did not respond within the allowed time",
    "code": "REQUEST_TIMEOUT",
    "requestId": "unique-request-id",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Consequences

### Positive

- **Resource Protection**: Prevents resource exhaustion from hanging requests
- **Predictable Behavior**: Clear expectations for request duration
- **Monitoring**: Easy to track and alert on timeout issues
- **User Experience**: Fast feedback when operations take too long
- **Flexibility**: Different timeouts for different operation types

### Negative

- **Complexity**: Additional configuration to maintain
- **False Positives**: Legitimate long operations might timeout
- **Testing**: Timeout behavior is harder to test

### Mitigation Strategies

1. **Monitoring**: Track timeout rates and adjust values based on real usage
2. **Documentation**: Clear documentation of timeout values for each endpoint
3. **Client Retry Logic**: Implement exponential backoff for timeout errors
4. **Progress Indicators**: For long operations, implement progress endpoints

## Alternatives Considered

1. **Single Global Timeout**: Simpler but doesn't accommodate different operation types
2. **No Timeouts**: Relies on client timeouts but risks server resource exhaustion
3. **Dynamic Timeouts**: Based on request complexity, but adds significant complexity

## References

- [Fastify Timeouts Documentation](https://www.fastify.io/docs/latest/Reference/Server/#connectiontimeout)
- [Node.js HTTP Timeouts](https://nodejs.org/api/http.html#http_server_timeout)
- [OWASP REST Security - Timeouts](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#security-headers)
