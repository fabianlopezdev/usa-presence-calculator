# API Development Guide

This guide covers the development setup and available scripts for the USA Presence Calculator API.

## Prerequisites

- Node.js >= 18
- pnpm >= 8.0.0
- SQLite (included via better-sqlite3)

## Development Scripts

### Primary Development Commands

```bash
# Start development server with hot reload (recommended)
pnpm dev

# Alternative development modes
pnpm dev:nodemon    # Using nodemon for more control
pnpm dev:tsc        # Compile TypeScript and run compiled code
pnpm dev:built      # Build once and watch compiled output
pnpm dev:debug      # Start with Node.js debugging enabled
```

### Build Commands

```bash
# Build the project
pnpm build

# Watch mode for TypeScript compilation
pnpm build:watch
```

### Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Code Quality

```bash
# Type checking
pnpm typecheck
pnpm typecheck:watch

# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
pnpm format:check
```

### Database Management

```bash
# Generate migration files from schema changes
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Push schema changes directly (development only)
pnpm db:push

# Open Drizzle Studio for database inspection
pnpm db:studio
```

### Setup & Maintenance

```bash
# Initial setup (install deps, generate & run migrations)
pnpm dev:setup

# Clean and reinstall (removes dist, node_modules, .turbo)
pnpm dev:clean
```

## Development Workflows

### Starting Fresh

1. Clone the repository
2. Navigate to the API directory: `cd api`
3. Run setup: `pnpm dev:setup`
4. Create `.env` file based on `.env.example`
5. Start development: `pnpm dev`

### Making Schema Changes

1. Edit schema files in `src/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Review generated SQL in `migrations/`
4. Run migration: `pnpm db:migrate`

### Debugging

To debug the API:

1. Start with debug mode: `pnpm dev:debug`
2. Attach your debugger to the Node.js process
3. Use VS Code's built-in debugger or Chrome DevTools

### Using Different Development Modes

- **tsx watch (default)**: Fast startup, good for most development
- **nodemon**: More configuration options, custom restart behavior
- **tsc-watch**: Ensures TypeScript compilation, good for type checking
- **built mode**: Uses Node.js native watch, minimal overhead

## Environment Variables

Required environment variables for development:

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL=./dev.db
DATABASE_ENCRYPTION_KEY=<32+ character key>
MASTER_ENCRYPTION_KEY=<32+ character key>
JWT_SECRET=<32+ character key>
COOKIE_SECRET=<32+ character key>
```

## Troubleshooting

### Port Already in Use

The development scripts will attempt to use port 3000 by default. If occupied, configure a different port in your `.env` file.

### Database Issues

If you encounter database errors:

1. Delete the database file: `rm dev.db`
2. Run migrations again: `pnpm db:migrate`

### TypeScript Errors

For persistent TypeScript errors:

1. Clear TypeScript cache: `rm -rf dist`
2. Rebuild: `pnpm build`

## Development Tips

1. **Hot Reload**: The default `pnpm dev` command supports hot reload for fast iteration
2. **Type Safety**: Run `pnpm typecheck:watch` in a separate terminal for continuous type checking
3. **Database Inspection**: Use `pnpm db:studio` to visually inspect your database
4. **API Documentation**: Swagger UI is available at `http://localhost:3000/documentation` in development mode

## Performance Monitoring

The development server includes performance monitoring:

- Request/response times are logged
- Database query performance is tracked
- Memory usage can be monitored via Node.js debugging tools