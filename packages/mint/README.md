# MINT Format

**Minimal Inference Notation for Tokens**

A fresh, human-readable, token-efficient data format for LLM prompts.
Combines YAML simplicity with Markdown table clarity.

[![CI](https://github.com/q1k-oss/mint/actions/workflows/publish.yml/badge.svg)](https://github.com/q1k-oss/mint/actions/workflows/publish.yml)
[![npm version](https://img.shields.io/npm/v/@q1k-oss/mint-format.svg)](https://www.npmjs.com/package/@q1k-oss/mint-format)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/q1k-oss/mint/blob/main/LICENSE)

**[Live Playground](https://mint.q1k.ai)** | **[Full Specification](https://github.com/q1k-oss/mint/blob/main/SPEC.md)** | **[GitHub](https://github.com/q1k-oss/mint)**

---

## Why MINT?

Modern LLMs are powerful but **tokens cost money**. Existing formats force a tradeoff:

| Format | Problem |
|--------|---------|
| **JSON** | Verbose — ~40% overhead from braces, quotes, repeated keys |
| **YAML** | Better — but arrays of objects still repeat every key |
| **TOON** | Efficient — but cryptic syntax, hard to read |
| **CSV** | Compact — but no structure, can't nest |

**MINT** gives you the best of all worlds — **47% smaller than JSON** with **zero learning curve**.

---

## Key Features

- **Fresh & Clean** — Instantly readable, no learning curve
- **47% Fewer Tokens** — Significant cost savings on LLM APIs
- **Crystal Clear** — Visible `|` boundaries, Markdown tables
- **Edit-Friendly** — No invisible tabs, no alignment headaches
- **Lossless** — Perfect JSON round-trip (`encode` → `decode` returns identical data)
- **Fast** — Simple parsing, zero dependencies
- **Tiny** — ~5KB minified

---

## Installation

```bash
# npm
npm install @q1k-oss/mint-format

# pnpm
pnpm add @q1k-oss/mint-format

# yarn
yarn add @q1k-oss/mint-format
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

```
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
// {
//   "users": [
//     { "id": 1, "name": "Alice", "role": "admin" },
//     { "id": 2, "name": "Bob", "role": "user" }
//   ]
// }
```

---

## Format Overview

### Objects — YAML Style

```
user:
  id: 123
  name: Alice
  email: alice@example.com
  active: true
```

### Nested Objects

```
config:
  database:
    host: localhost
    port: 5432
  cache:
    enabled: true
    ttl: 3600
```

### Arrays of Objects — Markdown Tables

This is where MINT shines:

```
employees:
  | id | name    | department  | salary |
  | 1  | Alice   | Engineering | 95000  |
  | 2  | Bob     | Marketing   | 75000  |
  | 3  | Charlie | Sales       | 80000  |
```

### Simple Arrays — Inline

```
tags: typescript, javascript, nodejs
numbers: 1, 2, 3, 4, 5
```

### Null Values

Use `-` in tables:

```
results:
  | id | name  | score |
  | 1  | Alice | 95    |
  | 2  | Bob   | -     |
```

### Compact Mode (Optional)

Enable symbols for extra compression:

```
# Standard          # Compact (opt-in)
| status    |       | st |
| completed |       | ✓  |
| pending   |       | ⏳ |
| failed    |       | ✗  |
```

---

## Real-World Example

```
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

---

## API Reference

### `encode(value, options?): string`

Converts JavaScript values to MINT format.

```typescript
import { encode } from '@q1k-oss/mint-format';

const mint = encode(data, {
  indent: 2,        // Spaces per level (default: 2)
  compact: false,   // Use symbols (default: false)
  sortKeys: false,  // Sort object keys (default: false)
});
```

### `decode(input, options?): unknown`

Parses MINT string back to JavaScript values.

```typescript
import { decode } from '@q1k-oss/mint-format';

const data = decode(mintString, {
  strict: true,     // Throw on invalid syntax (default: true)
});
```

### `validate(input): ValidationResult`

Validates MINT syntax without full parsing.

```typescript
import { validate } from '@q1k-oss/mint-format';

const result = validate(mintString);
if (!result.valid) {
  console.error(result.errors);
  // errors include line/column information
}
```

### `estimateTokens(data): TokenEstimate`

Estimates token counts for JSON vs MINT.

```typescript
import { estimateTokens } from '@q1k-oss/mint-format';

const estimate = estimateTokens(data);
console.log(estimate);
// {
//   json: 3245,
//   mint: 1756,
//   savings: 1489,
//   savingsPercent: 45.9
// }
```

---

## CLI

A companion CLI tool is available as a separate package:

```bash
# No install needed
npx @q1k-oss/mint-format-cli input.json -o output.mint

# Or install globally
npm install -g @q1k-oss/mint-format-cli
```

| Option | Description |
|--------|-------------|
| `-o, --output <file>` | Output file path |
| `-e, --encode` | Force JSON → MINT |
| `-d, --decode` | Force MINT → JSON |
| `--compact` | Enable symbol compression |
| `--stats` | Show token count & savings |
| `--indent <n>` | Indentation spaces (default: 2) |
| `--validate` | Validate input without conversion |

---

## Benchmarks

| Dataset | JSON Tokens | MINT Tokens | Savings |
|---------|-------------|-------------|---------|
| User records (100 rows) | 3,245 | 1,756 | **46%** |
| API responses (50 items) | 2,891 | 1,534 | **47%** |
| Workflow states (25 steps) | 1,567 | 892 | **43%** |
| Nested configs | 892 | 523 | **41%** |
| **Average** | - | - | **~45%** |

---

## Comparison

### vs JSON

```json
{
  "users": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ]
}
```

```
users:
  | id | name  |
  | 1  | Alice |
  | 2  | Bob   |
```

**MINT: 47% smaller, equally readable.**

### vs YAML

```yaml
users:
  - id: 1
    name: Alice
  - id: 2
    name: Bob
```

**MINT: 35% smaller for arrays of objects.**

---

## When to Use MINT

**Perfect For:**
- Sending structured data to LLMs
- Reducing token costs (API billing)
- Human-readable LLM prompts
- Arrays of similar objects
- Agentic AI workflows
- Version-controlled data (clean diffs)

**Consider Alternatives For:**
- Maximum compression needed → TOON
- API interoperability → JSON
- Binary data → MessagePack

---

## Try It Online

Visit **[mint.q1k.ai](https://mint.q1k.ai)** to try MINT in your browser — encode, decode, and see token savings in real time.

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/q1k-oss/mint/blob/main/CONTRIBUTING.md).

```bash
git clone https://github.com/q1k-oss/mint.git
cd mint
pnpm install
pnpm test
pnpm build
```

---

## License

[MIT](https://github.com/q1k-oss/mint/blob/main/LICENSE)

---

**MINT Format** — Fresh data for LLMs. Keep it minimal.
