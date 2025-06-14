# USA Presence Calculator - API Documentation

Welcome to the comprehensive documentation for the USA Presence Calculator API. This documentation is organized to help you quickly understand, develop, and maintain the API service.

## 📁 Documentation Structure

### 🏗️ Architecture & Design

Documentation about API architecture, design patterns, and implementation decisions.

- **[Technical Architecture](./architecture/TECHNICAL_ARCHITECTURE.md)** - Complete API architecture overview
- **[API Design Patterns](./architecture/API_DESIGN_PATTERNS.md)** - RESTful patterns and best practices
- **[Security Best Practices](./security/SECURITY_BEST_PRACTICES.md)** - Security measures and guidelines

### 📚 API & Code References

Detailed references for routes, plugins, middleware, and database schemas.

- **[Routes Reference](./reference/ROUTES_REFERENCE.md)** - Complete API endpoint documentation
- **[Plugins Reference](./reference/PLUGINS_REFERENCE.md)** - Fastify plugins and configurations
- **[Middleware Reference](./reference/MIDDLEWARE_REFERENCE.md)** - Request processing middleware
- **[Constants Reference](./reference/CONSTANTS_REFERENCE.md)** - API constants and configurations
- **[Database Reference](./reference/DATABASE_REFERENCE.md)** - Schema definitions and relationships

### 🧪 Testing Documentation

Information about test coverage, testing strategies, and test organization.

- **[Tests Reference](./testing/TESTS_REFERENCE.md)** - Comprehensive test documentation
- **[Testing Patterns](./testing/TESTING_PATTERNS.md)** - Unit, integration, and E2E testing

### 🔧 Development Guides

Practical guides for development, deployment, and operations.

- **[Development Guide](../DEVELOPMENT.md)** - Setup and development workflow
- **[Troubleshooting Guide](./guides/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Deployment Guide](./guides/DEPLOYMENT.md)** - Production deployment procedures

## 🚀 Quick Links

### For New Developers

1. Start with [Technical Architecture](./architecture/TECHNICAL_ARCHITECTURE.md)
2. Review [API Design Patterns](./architecture/API_DESIGN_PATTERNS.md)
3. Check [Routes Reference](./reference/ROUTES_REFERENCE.md) for endpoints
4. Read [Development Guide](../DEVELOPMENT.md) for setup

### For API Consumers

1. See [Routes Reference](./reference/ROUTES_REFERENCE.md) for all endpoints
2. Check [Authentication Guide](./guides/AUTHENTICATION.md) for auth flows
3. Review response formats and error codes

### For DevOps

1. Check [Deployment Guide](./guides/DEPLOYMENT.md)
2. Review [Security Best Practices](./security/SECURITY_BEST_PRACTICES.md)
3. See monitoring and logging setup

## 📊 API Statistics

- **5 Main Route Groups** (health, auth, users, trips, sync)
- **31 Total Endpoints** across all routes
- **13 Fastify Plugins** for various functionalities
- **10 Security Layers** (CORS, Helmet, rate limiting, etc.)
- **4 Authentication Methods** (passkeys, magic links, JWT, refresh tokens)
- **100% Zod Validation** on all inputs
- **Comprehensive Test Coverage** with unit, integration, and E2E tests

## 🔒 Security Features

- **JWT-based authentication** with short-lived access tokens
- **Passkey support** for passwordless authentication
- **Rate limiting** on all endpoints
- **Request validation** using Zod schemas
- **SQL injection protection** via Drizzle ORM
- **XSS protection** through CSP headers
- **CORS configuration** for cross-origin requests
- **Request signing** for enhanced security

## 📈 Recent Updates

- Implemented request context tracking with correlation IDs
- Added comprehensive error handling with typed errors
- Enhanced monitoring with Prometheus metrics
- Improved rate limiting with user-specific limits
- Added request timeout management
- Implemented graceful shutdown handling

## 🛠️ Technology Stack

- **Framework**: Fastify 5.x (high-performance Node.js framework)
- **Database**: SQLite with better-sqlite3 (production-ready embedded DB)
- **ORM**: Drizzle ORM (type-safe SQL)
- **Validation**: Zod (runtime type checking)
- **Authentication**: JWT + Passkeys (WebAuthn)
- **Documentation**: OpenAPI 3.0 via Swagger
- **Testing**: Jest + Supertest
- **Monitoring**: Prometheus metrics

---

Last updated: January 2025
