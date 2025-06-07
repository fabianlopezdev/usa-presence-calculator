# USA Presence Calculator

A premium mobile application for U.S. Lawful Permanent Residents to track their physical presence for naturalization eligibility.

## 🚀 Project Structure

This is a monorepo project using pnpm workspaces:

- `mobile/` - React Native + Expo mobile application
- `api/` - NestJS backend API
- `shared/` - Shared types and validation schemas (Zod)

## 🛠️ Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Install git hooks
pnpm prepare
```

## 🏃‍♂️ Development

```bash
# Run all packages in development mode
pnpm dev

# Run specific package
pnpm --filter mobile dev
pnpm --filter api dev
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter mobile test
```

## 📝 Code Quality

```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Check TypeScript types
pnpm typecheck

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## 🔄 Git Workflow

This project uses conventional commits. All commits must follow the format:

```
type(scope): description

feat: new feature
fix: bug fix
docs: documentation changes
style: code style changes
refactor: code refactoring
test: test changes
chore: maintenance tasks
```

## 📱 Features

- Track physical presence in the USA
- OCR scanning for flight tickets
- Travel simulator for planning
- Visual calendar with presence indicators
- PDF export for legal documentation
- Offline-first architecture
- Privacy-focused design

## 🔐 Security

- OAuth 2.0 authentication (Apple/Google)
- Biometric authentication
- Local data encryption
- No unnecessary data collection

## 📄 License

Proprietary - All rights reserved
