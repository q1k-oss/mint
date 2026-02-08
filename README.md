# <img src=".github/logo.png" alt="MINT" width="28"> MINT Format

<p align="center">
  <img src=".github/logo.png" alt="MINT Format Logo" width="180">
</p>

<p align="center">
  <strong>Minimal Inference Notation for Tokens</strong>
</p>

<p align="center">
  A fresh, human-readable, token-efficient data format for LLM prompts.<br>
  Combines YAML simplicity with Markdown table clarity.
</p>

<p align="center">
  <a href="https://github.com/q1k-oss/mint/actions/workflows/publish.yml">
    <img src="https://github.com/q1k-oss/mint/actions/workflows/publish.yml/badge.svg" alt="CI">
  </a>
  <a href="https://www.npmjs.com/package/@q1k-oss/mint-format">
    <img src="https://img.shields.io/npm/v/@q1k-oss/mint-format.svg" alt="npm version">
  </a>
  <a href="https://github.com/q1k-oss/mint/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT">
  </a>
  <a href="https://github.com/q1k-oss/mint/blob/main/SPEC.md">
    <img src="https://img.shields.io/badge/spec-v1.0-brightgreen" alt="SPEC v1.0">
  </a>
</p>

---

## Why MINT?

Modern LLMs are powerful but **tokens cost money**. Existing formats force a tradeoff:

| Format | Problem |
|--------|---------|
| **JSON** | Verbose — ~40% overhead from braces, quotes, repeated keys |
| **YAML** | Better — but arrays of objects still repeat every key |
| **TOON** | Efficient — but cryptic syntax, hard to read |
| **CSV** | Compact — but no structure, can't nest |

**MINT** gives you the best of all worlds:

```mint
workflow:
  id: wf_7x9k2m
  name: Invoice Reconciliation
  status: awaiting_review

steps:
  | id | tool            | status    | duration | output          |
  | 1  | gmail_search    | completed | 7s       | Found 23 emails |
  | 2  | document_parser | completed | 32s      | Parsed 21 docs  |
  | 3  | sheets_lookup   | completed | 16s      | Matched 18 POs  |
  | 4  | slack_notify    | pending   | -        | -               |

messages:
  | role      | content                              |
  | user      | Run invoice reconciliation           |
  | assistant | Starting reconciliation...           |
  | assistant | Found 3 discrepancies. Please review.|
```

**47% smaller than JSON** with **zero learning curve**.

---

## Key Features

- <img src=".github/logo.png" alt="MINT" width="16"> **Fresh & Clean** — Instantly readable, no learning curve
- 📉 **47% Fewer Tokens** — Significant cost savings on LLM APIs  
- 👁️ **Crystal Clear** — Visible `|` boundaries, Markdown tables
- ✏️ **Edit-Friendly** — No invisible tabs, no alignment headaches
- 🔄 **Lossless** — Perfect JSON round-trip
- 🚀 **Fast** — Simple parsing, zero dependencies
- 📦 **Tiny** — ~5KB minified

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Format Overview](#format-overview)
- [CLI Usage](#cli-usage)
- [API Reference](#api-reference)
- [Benchmarks](#benchmarks)
- [Specification](#specification)
- [Comparison](#comparison-with-other-formats)
- [Contributing](#contributing)

---

## Installation

```bash
# npm
npm install @q1k-oss/mint-format

# pnpm  
pnpm add @q1k-oss/mint-format

# yarn
yarn add @q1k-oss/mint-format

# CLI (no install needed)
npx @q1k-oss/mint-format-cli input.json -o output.mint
```

---

## Quick Start

### Encode (JSON → MINT)

```typescript
import { encode } from '@q1k-oss/mint-format';

const data = {
  users: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
    { id: 3, name: 'Charlie', role: 'user' }
  ]
};

console.log(encode(data));
```

**Output:**

```mint
users:
  | id | name    | role  |
  | 1  | Alice   | admin |
  | 2  | Bob     | user  |
  | 3  | Charlie | user  |
```

### Decode (MINT → JSON)

```typescript
import { decode } from '@q1k-oss/mint-format';

const mint = `
users:
  | id | name  | role  |
  | 1  | Alice | admin |
  | 2  | Bob   | user  |
`;

const data = decode(mint);
console.log(JSON.stringify(data, null, 2));
```

**Output:**

```json
{
  "users": [
    { "id": 1, "name": "Alice", "role": "admin" },
    { "id": 2, "name": "Bob", "role": "user" }
  ]
}
```

---

## Format Overview

### Objects — YAML Style

```mint
user:
  id: 123
  name: Alice
  email: alice@example.com
  active: true
```

### Nested Objects

```mint
config:
  database:
    host: localhost
    port: 5432
  cache:
    enabled: true
    ttl: 3600
```

### Arrays of Objects — Markdown Tables

This is where MINT shines ✨

```mint
employees:
  | id | name    | department  | salary |
  | 1  | Alice   | Engineering | 95000  |
  | 2  | Bob     | Marketing   | 75000  |
  | 3  | Charlie | Sales       | 80000  |
```

### Simple Arrays — Inline

```mint
tags: typescript, javascript, nodejs
numbers: 1, 2, 3, 4, 5
```

### Null Values

Use `-` in tables:

```mint
results:
  | id | name  | score |
  | 1  | Alice | 95    |
  | 2  | Bob   | -     |
```

### Compact Mode (Optional)

Enable symbols for extra compression:

```mint
# Standard
| status    |
| completed |
| pending   |
| failed    |

# Compact (opt-in)
| st |
| ✓  |
| ⏳ |
| ✗  |
```

---

## CLI Usage

```bash
# JSON to MINT
npx @q1k-oss/mint-format-cli input.json -o output.mint

# MINT to JSON  
npx @q1k-oss/mint-format-cli input.mint -o output.json

# Pipe from stdin
cat data.json | npx @q1k-oss/mint-format-cli > output.mint

# Show token savings
npx @q1k-oss/mint-format-cli data.json --stats
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output file path |
| `-e, --encode` | Force JSON → MINT |
| `-d, --decode` | Force MINT → JSON |
| `--compact` | Enable symbol compression |
| `--stats` | Show token count & savings |
| `--indent <n>` | Indentation spaces (default: 2) |

---

## API Reference

### `encode(value, options?): string`

```typescript
import { encode } from '@q1k-oss/mint-format';

const mint = encode(data, {
  indent: 2,        // Spaces per level (default: 2)
  compact: false,   // Use symbols (default: false)
  sortKeys: false,  // Sort object keys (default: false)
});
```

### `decode(input, options?): unknown`

```typescript
import { decode } from '@q1k-oss/mint-format';

const data = decode(mintString, {
  strict: true,     // Throw on invalid syntax (default: true)
});
```

### `validate(input): ValidationResult`

```typescript
import { validate } from '@q1k-oss/mint-format';

const result = validate(mintString);
if (!result.valid) {
  console.error(result.errors);
}
```

### `estimateTokens(data): TokenEstimate`

```typescript
import { estimateTokens } from '@q1k-oss/mint-format';

const estimate = estimateTokens(data);
console.log(`Savings: ${estimate.savingsPercent}%`);
```

---

## Benchmarks

### Token Efficiency

| Dataset | JSON | MINT | Savings |
|---------|------|------|---------|
| User records (100 rows) | 3,245 | 1,756 | **46%** |
| API responses (50 items) | 2,891 | 1,534 | **47%** |
| Workflow states (25 steps) | 1,567 | 892 | **43%** |
| Nested configs | 892 | 523 | **41%** |
| **Average** | - | - | **~45%** |

### Why MINT is Efficient

1. **Table headers once** — Column names only in header row
2. **No repeated braces** — Tables use `|` not `{}` per row  
3. **Minimal quoting** — Most values unquoted
4. **Visual structure** — Pipes tokenize well in LLMs

---

## Comparison with Other Formats

### vs JSON

```json
{
  "users": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ]
}
```

```mint
users:
  | id | name  |
  | 1  | Alice |
  | 2  | Bob   |
```

**MINT: 47% smaller, equally readable**

### vs TOON

```toon
users[2]{id,name}:
  1,Alice
  2,Bob
```

```mint
users:
  | id | name  |
  | 1  | Alice |
  | 2  | Bob   |
```

**MINT: ~15% larger, but far more readable**

### vs YAML

```yaml
users:
  - id: 1
    name: Alice
  - id: 2
    name: Bob
```

```mint
users:
  | id | name  |
  | 1  | Alice |
  | 2  | Bob   |
```

**MINT: 35% smaller for arrays of objects**

### Summary

```
                    EFFICIENCY
                        ▲
              TOON ●    │
                        │
              MINT ●────┼──── ✨ Best balance
                        │
              YAML ●    │
                        │
              JSON ●    │
                        └────────────────► READABILITY
```

---

## When to Use MINT

### ✅ Perfect For

- Sending structured data to LLMs
- Reducing token costs (API billing)
- Human-readable LLM prompts
- Arrays of similar objects
- Agentic AI workflows
- Version-controlled data (clean diffs)

### ❌ Consider Alternatives

- Maximum compression needed → TOON
- API interoperability → JSON
- Binary data → MessagePack

---

## Specification

See [SPEC.md](./SPEC.md) for the complete formal specification including ABNF grammar.

### Quick Reference

```
DOCUMENT     := (STATEMENT)*
STATEMENT    := KEY_VALUE | TABLE_BLOCK
KEY_VALUE    := KEY ':' VALUE NEWLINE
TABLE        := TABLE_HEADER TABLE_ROW+
TABLE_HEADER := '|' (COLUMN '|')+ NEWLINE
TABLE_ROW    := '|' (CELL '|')+ NEWLINE
```

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md).

```bash
# Setup
git clone https://github.com/q1k-oss/mint.git
cd mint
pnpm install

# Dev
pnpm test        # Run tests
pnpm build       # Build all packages
pnpm benchmark   # Run benchmarks
```

---

## Roadmap

- [x] TypeScript encoder/decoder
- [x] CLI tool
- [x] Comprehensive tests
- [ ] Python implementation
- [ ] Go implementation  
- [ ] Rust implementation
- [ ] VS Code extension
- [ ] Online playground

---

## License

[MIT](./LICENSE) © 2025 MINT Format Contributors

---

<p align="center">
  <strong><img src=".github/logo.png" alt="MINT" width="20"> MINT Format</strong><br>
  <em>Fresh data for LLMs. Keep it minimal.</em>
</p>
