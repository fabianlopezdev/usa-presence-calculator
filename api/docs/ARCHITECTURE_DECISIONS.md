# Architecture Decisions

This document records significant architectural decisions made for the USA Presence Calculator API.

## ADR-001: No Docker for Development and Initial Deployment

**Date**: December 2024

**Status**: Accepted

### Context

When setting up the backend infrastructure, we needed to decide whether to use Docker for containerization.

### Decision

We decided NOT to use Docker for this project.

### Reasons

1. **SQLite Simplicity**: We're using SQLite, which is a file-based database that doesn't require a separate server process
2. **Development Speed**: Direct Node.js execution is simpler for development and debugging
3. **Resource Efficiency**: No container overhead means lower memory and CPU usage
4. **Deployment Flexibility**: Many modern deployment platforms (Vercel, Railway, Render) handle Node.js apps without requiring Docker
5. **Team Efficiency**: Reduces complexity for a small team or solo developer

### Consequences

**Positive:**

- Simpler local development setup
- Faster startup times
- Easier debugging (no container layers)
- Lower resource usage
- Direct file system access for SQLite

**Negative:**

- Less environment consistency (mitigated by .nvmrc and package-lock)
- Manual dependency management on deployment servers
- No container orchestration benefits (not needed for our scale)

### Alternatives Considered

1. **Docker Compose**: Would provide consistency but adds complexity for a simple SQLite setup
2. **Docker for production only**: Would create dev/prod parity issues

### Notes

This decision can be revisited if we:

- Need to scale beyond a single server
- Switch to a client-server database like PostgreSQL
- Require complex deployment orchestration
