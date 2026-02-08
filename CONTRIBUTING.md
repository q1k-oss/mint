# 🌿 Contributing to MINT Format

Thank you for your interest in contributing! This document provides guidelines for contributing to MINT Format.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/q1k-oss/mint.git
cd mint

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build all packages
pnpm build
```

## Development Workflow

### Building

```bash
pnpm build              # Build all packages
pnpm --filter @q1k-oss/mint-format build  # Build specific package
```

### Testing

```bash
pnpm test               # Run all tests
pnpm test:watch         # Watch mode
pnpm test:coverage      # With coverage
```

### Linting & Formatting

```bash
pnpm lint               # Check lint errors
pnpm lint:fix           # Fix lint errors
pnpm format             # Format code
```

### Benchmarks

```bash
pnpm benchmark          # Run token benchmarks
```

## Pull Request Process

1. **Fork & Clone** the repository
2. **Create a branch** for your changes
3. **Make changes** with tests
4. **Run checks:**
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```
5. **Submit PR** with clear description

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add compact mode support
fix: handle empty arrays correctly
docs: update API documentation
test: add table parsing tests
```

## Coding Standards

- TypeScript strict mode
- 2 spaces indentation
- Single quotes
- Semicolons
- Clear, descriptive names

## Project Structure

```
mint-format/
├── packages/
│   ├── mint/           # Core library
│   │   └── src/
│   │       ├── index.ts
│   │       └── index.test.ts
│   └── cli/            # CLI tool
├── benchmarks/         # Performance tests
└── tests/conformance/  # Spec conformance
```

## Questions?

- 💬 [Discussions](https://github.com/q1k-oss/mint/discussions)
- 🐛 [Issues](https://github.com/q1k-oss/mint/issues)

Thanks for contributing! 🌿
