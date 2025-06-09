# USA Presence Calculator - Shared Package Documentation

Welcome to the comprehensive documentation for the USA Presence Calculator shared package. This documentation is organized into categories to help you quickly find what you need.

## 📁 Documentation Structure

### 🏗️ Architecture & Design
Documentation about system architecture, design decisions, and implementation patterns.

- **[Technical Architecture](./architecture/TECHNICAL_ARCHITECTURE.md)** - Complete system architecture overview
- **[Security Implementation](./architecture/SECURITY_IMPLEMENTATION.md)** - Security measures and safe wrapper patterns
- **[Error Handling](./architecture/ERROR_HANDLING.md)** - Result type pattern and error management

### 📚 API & Code References
Detailed references for constants, functions, schemas, and other code elements.

- **[Constants Reference](./reference/CONSTANTS_REFERENCE.md)** - All constants and configuration values
- **[Functions Reference](./reference/FUNCTIONS_REFERENCE.md)** - Complete function documentation
- **[Schemas Reference](./reference/SCHEMAS_REFERENCE.md)** - Zod schemas and TypeScript types
- **[Safe Wrappers Reference](./reference/SAFE_WRAPPERS_REFERENCE.md)** - Security wrapper functions

### 🧪 Testing Documentation
Information about test coverage, testing strategies, and test organization.

- **[Tests Reference](./testing/TESTS_REFERENCE.md)** - Comprehensive test documentation
- **[Security Tests](./testing/SECURITY_TESTS.md)** - Security-specific test coverage

## 🚀 Quick Links

### For New Developers
1. Start with [Technical Architecture](./architecture/TECHNICAL_ARCHITECTURE.md)
2. Review [Schemas Reference](./reference/SCHEMAS_REFERENCE.md) for data structures
3. Check [Functions Reference](./reference/FUNCTIONS_REFERENCE.md) for available APIs

### For Contributing
1. Read [Error Handling](./architecture/ERROR_HANDLING.md) for error patterns
2. Review [Security Implementation](./architecture/SECURITY_IMPLEMENTATION.md) for safe coding
3. Check [Tests Reference](./testing/TESTS_REFERENCE.md) for testing requirements

### For Integration
1. See [Safe Wrappers Reference](./reference/SAFE_WRAPPERS_REFERENCE.md) for validated functions
2. Review [Constants Reference](./reference/CONSTANTS_REFERENCE.md) for configuration
3. Check [Schemas Reference](./reference/SCHEMAS_REFERENCE.md) for data validation

## 📊 Package Statistics

- **231 Total Functions** (182 exported + 49 internal)
- **89 Zod Schemas** all using `.strict()` mode
- **52 Main Constants** with ~300+ individual values
- **878 Test Cases** with comprehensive coverage
- **11 Major Feature Areas** with safe wrappers
- **27 Safe Wrapper Functions** for validated input
- **10 Error Handling Utilities** for Result type pattern

## 🔒 Security Features

- All schemas use `.strict()` mode
- Safe wrapper functions with Result type
- Comprehensive input validation
- Error handling without exceptions
- Security-focused test suite

## 📈 Recent Updates

- Added comprehensive security implementation
- Implemented Result type pattern for error handling
- Created safe wrapper functions for all business logic
- Centralized validation messages for consistency
- Optimized barrel exports for better performance

---

Last updated: January 2025