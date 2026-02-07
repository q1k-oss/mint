# 🌿 MINT Format Specification

**Version:** 1.0.0  
**Status:** Stable  
**Last Updated:** December 2024

---

## 1. Introduction

**MINT** (Minimal Inference Notation for Tokens) is a data serialization format optimized for Large Language Model prompts. It minimizes token usage while maximizing human readability.

### 1.1 Design Philosophy

- **Familiar** — Uses YAML for objects, Markdown for tables
- **Minimal** — No unnecessary syntax overhead  
- **Readable** — Anyone can understand it instantly
- **Efficient** — 40-50% fewer tokens than JSON

### 1.2 Goals

1. Zero learning curve for developers
2. Significant token savings for LLM applications
3. Perfect round-trip with JSON data types
4. Simple implementation in any language

---

## 2. Document Structure

A MINT document consists of statements. Each statement is either:
- A key-value pair
- A table block

### 2.1 Root Level

The root is an implicit object:

```mint
name: Invoice Reconciliation
version: 2.1.0
active: true
```

Equivalent JSON:
```json
{
  "name": "Invoice Reconciliation",
  "version": "2.1.0",
  "active": true
}
```

---

## 3. Primitive Types

### 3.1 Strings

Unquoted by default:

```mint
name: Alice
path: /home/user/data
url: https://example.com
```

Quoted when containing special characters:

```mint
message: "Hello, World!"
query: "status: pending"
```

### 3.2 Numbers

```mint
integer: 42
negative: -17
float: 3.14159
scientific: 6.022e23
```

### 3.3 Booleans

```mint
active: true
deleted: false
```

### 3.4 Null

```mint
value: null
```

In tables, use `-`:

```mint
| id | nickname |
| 1  | -        |
```

---

## 4. Objects

### 4.1 Simple Objects

```mint
user:
  id: 123
  name: Alice
  email: alice@example.com
```

### 4.2 Nested Objects

```mint
config:
  database:
    host: localhost
    port: 5432
    pool:
      min: 5
      max: 20
```

### 4.3 Empty Objects

```mint
metadata:
```

---

## 5. Arrays

### 5.1 Inline Arrays (Primitives)

```mint
tags: red, green, blue
numbers: 1, 2, 3, 4, 5
```

### 5.2 Empty Arrays

```mint
items: []
```

### 5.3 Arrays of Objects → Tables

See Section 6.

---

## 6. Tables

Tables are the core innovation of MINT, representing arrays of objects efficiently.

### 6.1 Structure

```mint
key:
  | column1 | column2 | column3 |
  | value1  | value2  | value3  |
  | value4  | value5  | value6  |
```

### 6.2 Header Row

- First row defines column names (object keys)
- Must start and end with `|`
- Whitespace is trimmed

```mint
users:
  | id | name  | email           |
  | 1  | Alice | alice@test.com  |
  | 2  | Bob   | bob@test.com    |
```

Equivalent JSON:
```json
{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@test.com" },
    { "id": 2, "name": "Bob", "email": "bob@test.com" }
  ]
}
```

### 6.3 Column Alignment

Alignment is optional but recommended for readability:

```mint
# Both are valid:
| id | name  |
| 1  | Alice |

|id|name|
|1|Alice|
```

### 6.4 Null Cells

Use `-` for null:

```mint
| id | value |
| 1  | test  |
| 2  | -     |
```

### 6.5 Quoted Cells

Quote cells containing `|` or special characters:

```mint
| id | formula   |
| 1  | "x | y"   |
| 2  | "a: b"    |
```

### 6.6 Nested Tables

Tables can be nested under object properties:

```mint
company:
  name: Acme Corp
  departments:
    | id | name        | headcount |
    | 1  | Engineering | 50        |
    | 2  | Marketing   | 25        |
```

---

## 7. Whitespace & Indentation

### 7.1 Indentation

- Default: 2 spaces per level
- Must be consistent within document

```mint
level0:
  level1:
    level2: value
```

### 7.2 Blank Lines

Blank lines are allowed and ignored:

```mint
section1:
  key: value

section2:
  key: value
```

---

## 8. Comments

Comments start with `#`:

```mint
# This is a comment
user:
  name: Alice  # Inline comment
```

Comments are not preserved during round-trip.

---

## 9. Escaping & Quoting

### 9.1 When to Quote

Strings must be quoted when they:
- Contain `|` or `:` (not in URLs)
- Start/end with whitespace
- Match keywords (`true`, `false`, `null`)
- Look like numbers
- Are empty

### 9.2 Escape Sequences

| Sequence | Meaning |
|----------|---------|
| `\\` | Backslash |
| `\"` | Double quote |
| `\n` | Newline |
| `\r` | Carriage return |
| `\t` | Tab |

---

## 10. Compact Mode

Optional symbols for additional compression:

| Symbol | Meaning |
|--------|---------|
| `✓` | completed, success, true |
| `✗` | failed, error, false |
| `⏳` | pending, waiting |
| `⚠` | warning |
| `?` | review, unknown |
| `-` | null, none |

Enable via encoder options:
```typescript
encode(data, { compact: true });
```

---

## 11. Type Coercion

### 11.1 Parsing (MINT → JS)

| Input | Type |
|-------|------|
| `true` | boolean |
| `false` | boolean |
| `null`, `-` | null |
| `42`, `-3.14` | number |
| Everything else | string |

### 11.2 Encoding (JS → MINT)

| JavaScript | MINT |
|------------|------|
| `string` | Unquoted or quoted |
| `number` | Decimal |
| `boolean` | `true`/`false` |
| `null` | `null` or `-` in tables |
| `Array` | Inline or table |
| `Object` | Nested structure |
| `Date` | ISO string (quoted) |

---

## 12. ABNF Grammar

```abnf
document      = *statement

statement     = key-value / comment / blank-line

key-value     = key ":" [value] NEWLINE [block]

key           = identifier / quoted-string

value         = primitive / inline-array

primitive     = string / number / boolean / null

inline-array  = value *("," value)

block         = table / nested-object

table         = table-header 1*table-row

table-header  = "|" 1*(column-name "|") NEWLINE

table-row     = "|" 1*(cell "|") NEWLINE

cell          = primitive / "-"

nested-object = 1*(INDENT statement)

string        = unquoted-string / quoted-string

number        = ["-"] digits ["." digits] [exp]

boolean       = "true" / "false"

null          = "null"

comment       = "#" *CHAR NEWLINE

INDENT        = 2*SPACE
```

---

## 13. Examples

### 13.1 Simple Data

```mint
user:
  id: 123
  name: Alice
  active: true
  tags: admin, verified
```

### 13.2 Array of Objects

```mint
products:
  | sku   | name   | price | inStock |
  | A-001 | Widget | 29.99 | true    |
  | B-002 | Gadget | 49.99 | false   |
```

### 13.3 Complex Workflow

```mint
workflow:
  id: wf_reconciliation
  name: Invoice Reconciliation
  status: awaiting_review

steps:
  | id | tool            | status    | duration | output            |
  | 1  | gmail_search    | completed | 7s       | Found 23 invoices |
  | 2  | document_parser | completed | 32s      | Parsed 21 docs    |
  | 3  | sheets_lookup   | completed | 16s      | Matched 18 POs    |
  | 4  | slack_notify    | pending   | -        | -                 |

messages:
  | role      | content                            |
  | user      | Run invoice reconciliation         |
  | assistant | Starting process...                |
  | assistant | Found 3 discrepancies. Please review. |

errors:
  | step | code         | message                 | severity |
  | 2    | PARSE_FAILED | Could not extract table | warning  |
  | 2    | PARSE_FAILED | Corrupted PDF file      | error    |
```

---

## 14. Conformance

### 14.1 Levels

**Level 1: Basic**
- Primitives, simple objects, inline arrays

**Level 2: Standard**  
- Tables, nested structures, quoting

**Level 3: Full**
- Compact mode, comments, validation

### 14.2 Test Suite

See `/tests/conformance/` for validation fixtures.

---

## Appendix A: Token Efficiency

For an array of 10 objects with 5 fields:

| Format | Tokens |
|--------|--------|
| JSON | 250-300 |
| YAML | 180-220 |
| TOON | 120-150 |
| **MINT** | **140-170** |

MINT trades ~15% vs TOON for significantly better readability.

---

## Appendix B: Migration

### From JSON

1. Objects → Remove braces, use indentation
2. Arrays of objects → Convert to tables
3. Strings → Remove most quotes

### From YAML

1. Arrays of objects → Convert to tables
2. Everything else stays the same

### From TOON

1. `[N]{fields}:` → Table header row
2. Comma rows → Pipe rows

---

*End of Specification*
