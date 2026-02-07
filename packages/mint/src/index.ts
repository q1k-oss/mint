/**
 * 🌿 MINT Format - Minimal Inference Notation for Tokens
 *
 * A fresh, human-readable, token-efficient data format for LLM prompts.
 *
 * @packageDocumentation
 */

export interface EncodeOptions {
  /** Spaces per indentation level (default: 2) */
  indent?: number;
  /** Enable compact mode with symbols (default: false) */
  compact?: boolean;
  /** Sort object keys alphabetically (default: false) */
  sortKeys?: boolean;
}

export interface DecodeOptions {
  /** Enable strict validation (default: true) */
  strict?: boolean;
  /** Expected indentation spaces (default: 2) */
  indent?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  context?: string;
}

export interface TokenEstimate {
  json: number;
  mint: number;
  savings: number;
  savingsPercent: number;
}

// Status symbols for compact mode
const STATUS_SYMBOLS: Record<string, string> = {
  completed: '✓',
  complete: '✓',
  success: '✓',
  done: '✓',
  passed: '✓',
  true: '✓',
  yes: '✓',
  failed: '✗',
  failure: '✗',
  error: '✗',
  rejected: '✗',
  false: '✗',
  no: '✗',
  pending: '⏳',
  waiting: '⏳',
  in_progress: '⏳',
  running: '⏳',
  warning: '⚠',
  warn: '⚠',
  review: '?',
  unknown: '?',
};

const REVERSE_SYMBOLS: Record<string, string> = {
  '✓': 'true',
  '✗': 'false',
  '⏳': 'pending',
  '⚠': 'warning',
  '?': 'unknown',
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Check if a value needs quoting
 */
function needsQuoting(value: string): boolean {
  if (value === '') return true;
  if (value.startsWith(' ') || value.endsWith(' ')) return true;
  if (value.includes('|') || value.includes('\n') || value.includes('\r')) return true;
  if (value.includes(',')) return true; // Commas would be parsed as array separators
  if (/^-?\d+\.?\d*$/.test(value)) return true;
  if (['true', 'false', 'null'].includes(value.toLowerCase())) return true;
  if (value.includes(':') && !value.includes('://')) return true;
  if (value.includes('"')) return true;
  return false;
}

/**
 * Escape a string
 */
function escapeString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Unescape a string
 */
function unescapeString(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Format a primitive value
 */
function formatPrimitive(value: JsonValue, options: EncodeOptions, inTable = false): string {
  if (value === null || value === undefined) {
    return inTable ? '-' : 'null';
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'number') {
    if (!isFinite(value)) return 'null';
    return String(value);
  }

  if (typeof value === 'string') {
    if (options.compact && STATUS_SYMBOLS[value.toLowerCase()]) {
      return STATUS_SYMBOLS[value.toLowerCase()];
    }

    if (value === '' && inTable) return '-';
    if (needsQuoting(value)) {
      return `"${escapeString(value)}"`;
    }
    return value;
  }

  return String(value);
}

/**
 * Check if a value is a primitive (not an object or array)
 */
function isPrimitive(value: JsonValue): boolean {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

/**
 * Check if array can be a table
 */
function isTableArray(arr: JsonValue[]): arr is Record<string, JsonValue>[] {
  if (arr.length === 0) return false;

  if (!arr.every((item) => item !== null && typeof item === 'object' && !Array.isArray(item))) {
    return false;
  }

  const firstKeys = Object.keys(arr[0] as Record<string, JsonValue>)
    .sort()
    .join(',');

  const sameKeys = arr.every((item) => {
    const keys = Object.keys(item as Record<string, JsonValue>)
      .sort()
      .join(',');
    return keys === firstKeys;
  });

  if (!sameKeys) return false;

  // Only use table format if ALL values are primitives (no nested objects/arrays)
  return arr.every((item) => {
    const obj = item as Record<string, JsonValue>;
    return Object.values(obj).every((val) => isPrimitive(val));
  });
}

/**
 * Check if array contains only primitives
 */
function isPrimitiveArray(arr: JsonValue[]): boolean {
  return arr.every((item) => isPrimitive(item));
}

/**
 * Get column widths for table alignment
 */
function getColumnWidths(headers: string[], rows: string[][]): number[] {
  const widths = headers.map((h) => h.length);

  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      widths[i] = Math.max(widths[i] || 0, row[i]?.length || 0);
    }
  }

  return widths;
}

/**
 * Pad cell to width
 */
function padCell(value: string, width: number): string {
  return value + ' '.repeat(Math.max(0, width - value.length));
}

/**
 * Encode array as table
 */
function encodeTable(arr: Record<string, JsonValue>[], options: EncodeOptions, indentLevel: number): string {
  if (arr.length === 0) return '| |';

  const indent = ' '.repeat(options.indent || 2);
  const baseIndent = indent.repeat(indentLevel);

  const headers = Object.keys(arr[0]);
  const rows: string[][] = arr.map((obj) => headers.map((h) => formatPrimitive(obj[h], options, true)));

  const widths = getColumnWidths(headers, rows);

  const lines: string[] = [];

  // Header
  const headerCells = headers.map((h, i) => padCell(h, widths[i]));
  lines.push(`${baseIndent}| ${headerCells.join(' | ')} |`);

  // Rows
  for (const row of rows) {
    const cells = row.map((cell, i) => padCell(cell, widths[i]));
    lines.push(`${baseIndent}| ${cells.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * Encode value recursively
 */
function encodeValue(value: JsonValue, options: EncodeOptions, indentLevel: number): string {
  const indent = ' '.repeat(options.indent || 2);
  const baseIndent = indent.repeat(indentLevel);

  // Primitives
  if (value === null || typeof value !== 'object') {
    return formatPrimitive(value, options);
  }

  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    if (isPrimitiveArray(value)) {
      return value.map((v) => formatPrimitive(v, options)).join(', ');
    }

    if (isTableArray(value)) {
      return '\n' + encodeTable(value, options, indentLevel + 1);
    }

    // Mixed arrays
    const lines: string[] = [];
    for (const item of value) {
      if (item === null || typeof item !== 'object') {
        lines.push(`${baseIndent}${indent}- ${formatPrimitive(item, options)}`);
      } else {
        const encoded = encodeValue(item, options, indentLevel + 2);
        if (encoded.includes('\n')) {
          lines.push(`${baseIndent}${indent}-`);
          lines.push(encoded);
        } else {
          lines.push(`${baseIndent}${indent}- ${encoded}`);
        }
      }
    }
    return '\n' + lines.join('\n');
  }

  // Objects
  const obj = value as Record<string, JsonValue>;
  const keys = options.sortKeys ? Object.keys(obj).sort() : Object.keys(obj);

  if (keys.length === 0) {
    return '';
  }

  const lines: string[] = [];

  for (const key of keys) {
    const val = obj[key];

    if (val === null) {
      lines.push(`${baseIndent}${key}: null`);
    } else if (typeof val !== 'object') {
      lines.push(`${baseIndent}${key}: ${formatPrimitive(val, options)}`);
    } else if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${baseIndent}${key}: []`);
      } else if (isPrimitiveArray(val)) {
        lines.push(`${baseIndent}${key}: ${val.map((v) => formatPrimitive(v, options)).join(', ')}`);
      } else {
        lines.push(`${baseIndent}${key}:${encodeValue(val, options, indentLevel)}`);
      }
    } else {
      const nested = encodeValue(val, options, indentLevel + 1);
      if (nested === '') {
        lines.push(`${baseIndent}${key}:`);
      } else if (nested.includes('\n')) {
        lines.push(`${baseIndent}${key}:`);
        lines.push(nested);
      } else {
        lines.push(`${baseIndent}${key}: ${nested}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Encode JavaScript value to MINT format
 *
 * @param value - Value to encode
 * @param options - Encoding options
 * @returns MINT-formatted string
 *
 * @example
 * ```typescript
 * const data = {
 *   users: [
 *     { id: 1, name: 'Alice' },
 *     { id: 2, name: 'Bob' }
 *   ]
 * };
 *
 * console.log(encode(data));
 * // users:
 * //   | id | name  |
 * //   | 1  | Alice |
 * //   | 2  | Bob   |
 * ```
 */
export function encode(value: unknown, options: EncodeOptions = {}): string {
  const opts: EncodeOptions = {
    indent: 2,
    compact: false,
    sortKeys: false,
    ...options,
  };

  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value !== 'object') {
    return formatPrimitive(value as JsonValue, opts);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '_: []';
    if (isPrimitiveArray(value)) {
      return `_: ${value.map((v) => formatPrimitive(v, opts)).join(', ')}`;
    }
    if (isTableArray(value)) {
      return `_:\n${encodeTable(value, opts, 1)}`;
    }
    return `_:${encodeValue(value, opts, 0)}`;
  }

  return encodeValue(value as JsonValue, opts, 0);
}

/**
 * Parse a primitive string value
 */
function parsePrimitive(value: string): JsonValue {
  const trimmed = value.trim();

  if (trimmed === 'null' || trimmed === '-' || trimmed === '') {
    return null;
  }

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  if (REVERSE_SYMBOLS[trimmed]) {
    return REVERSE_SYMBOLS[trimmed];
  }

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return unescapeString(trimmed.slice(1, -1));
  }

  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    if (isFinite(num)) return num;
  }

  return trimmed;
}

/**
 * Parse table from lines
 */
function parseTable(
  lines: string[],
  startIndex: number,
  indent: number
): { value: JsonValue[]; endIndex: number } {
  const result: Record<string, JsonValue>[] = [];
  let headers: string[] = [];
  let i = startIndex;

  const headerLine = lines[i].trim();
  if (!headerLine.startsWith('|')) {
    return { value: [], endIndex: startIndex };
  }

  headers = headerLine
    .split('|')
    .slice(1, -1)
    .map((h) => h.trim());

  i++;

  while (i < lines.length) {
    const line = lines[i];
    const lineIndent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    if (!trimmed.startsWith('|')) {
      break;
    }

    if (lineIndent < indent && trimmed !== '') {
      break;
    }

    const cells = trimmed
      .split('|')
      .slice(1, -1)
      .map((c) => parsePrimitive(c.trim()));

    if (cells.length === headers.length) {
      const row: Record<string, JsonValue> = {};
      headers.forEach((h, idx) => {
        row[h] = cells[idx];
      });
      result.push(row);
    }

    i++;
  }

  return { value: result, endIndex: i - 1 };
}

/**
 * Parse document
 */
function parseDocument(
  lines: string[],
  startIndex: number,
  baseIndent: number,
  options: DecodeOptions
): { value: JsonValue; endIndex: number } {
  const result: Record<string, JsonValue> = {};
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '' || line.trim().startsWith('#')) {
      i++;
      continue;
    }

    const lineIndent = line.length - line.trimStart().length;

    // If we've dedented past our level, stop
    if (lineIndent < baseIndent) {
      break;
    }

    // Skip lines that are more indented (they belong to nested structures)
    if (lineIndent > baseIndent) {
      i++;
      continue;
    }

    const trimmed = line.trim();

    // Table rows at this level shouldn't happen in object context
    if (trimmed.startsWith('|')) {
      i++;
      continue;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      i++;
      continue;
    }

    const key = trimmed.slice(0, colonIndex).trim();
    const valueStr = trimmed.slice(colonIndex + 1).trim();

    if (valueStr === '' || valueStr === '[]') {
      // Look ahead for nested content
      let foundNested = false;
      let nextIdx = i + 1;

      // Skip blank lines to find actual content
      while (nextIdx < lines.length && lines[nextIdx].trim() === '') {
        nextIdx++;
      }

      if (nextIdx < lines.length) {
        const nextLine = lines[nextIdx];
        const nextIndent = nextLine.length - nextLine.trimStart().length;
        const nextTrimmed = nextLine.trim();

        if (nextIndent > baseIndent && nextTrimmed.startsWith('|')) {
          // Parse table
          const tableResult = parseTable(lines, nextIdx, nextIndent);
          result[key] = tableResult.value;
          i = tableResult.endIndex + 1;
          foundNested = true;
        } else if (nextIndent > baseIndent && nextTrimmed !== '' && !nextTrimmed.startsWith('#')) {
          // Parse nested object
          const nestedResult = parseDocument(lines, nextIdx, nextIndent, options);
          result[key] = nestedResult.value;
          i = nestedResult.endIndex;
          foundNested = true;
        }
      }

      if (!foundNested) {
        result[key] = valueStr === '[]' ? [] : {};
        i++;
      }
    } else if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
      // Quoted string - parse as single value, don't split
      result[key] = parsePrimitive(valueStr);
      i++;
    } else if (valueStr.includes(' | ')) {
      result[key] = valueStr.split(' | ').map((v) => parsePrimitive(v.trim()));
      i++;
    } else if (valueStr.includes(', ')) {
      result[key] = valueStr.split(', ').map((v) => parsePrimitive(v.trim()));
      i++;
    } else {
      result[key] = parsePrimitive(valueStr);
      i++;
    }
  }

  return { value: result, endIndex: i };
}

/**
 * Decode MINT string to JavaScript value
 *
 * @param input - MINT-formatted string
 * @param options - Decoding options
 * @returns Parsed JavaScript value
 *
 * @example
 * ```typescript
 * const mint = `
 * users:
 *   | id | name  |
 *   | 1  | Alice |
 *   | 2  | Bob   |
 * `;
 *
 * const data = decode(mint);
 * console.log(data.users[0].name); // "Alice"
 * ```
 */
export function decode(input: string, options: DecodeOptions = {}): unknown {
  const opts: DecodeOptions = {
    strict: true,
    indent: 2,
    ...options,
  };

  const normalized = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  if (lines.every((l) => l.trim() === '' || l.trim().startsWith('#'))) {
    return {};
  }

  let startIndex = 0;
  while (
    startIndex < lines.length &&
    (lines[startIndex].trim() === '' || lines[startIndex].trim().startsWith('#'))
  ) {
    startIndex++;
  }

  if (startIndex >= lines.length) {
    return {};
  }

  const firstLine = lines[startIndex].trim();
  if (firstLine.startsWith('|')) {
    const tableResult = parseTable(lines, startIndex, 0);
    return tableResult.value;
  }

  if (firstLine.startsWith('_:')) {
    const valueStr = firstLine.slice(2).trim();
    if (valueStr === '' || valueStr === '[]') {
      const nextLine = lines[startIndex + 1];
      if (nextLine && nextLine.trim().startsWith('|')) {
        const tableResult = parseTable(lines, startIndex + 1, 2);
        return tableResult.value;
      }
      return [];
    }
    if (valueStr.includes(', ')) {
      return valueStr.split(', ').map((v) => parsePrimitive(v.trim()));
    }
    return [parsePrimitive(valueStr)];
  }

  const result = parseDocument(lines, startIndex, 0, opts);
  return result.value;
}

/**
 * Validate MINT syntax
 *
 * @param input - MINT-formatted string
 * @returns Validation result with errors
 */
export function validate(input: string): ValidationResult {
  const errors: ValidationError[] = [];
  const lines = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  let inTable = false;
  let tableColumns = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const indent = line.length - line.trimStart().length;

    if (indent % 2 !== 0) {
      errors.push({
        line: lineNum,
        column: 1,
        message: `Inconsistent indentation: ${indent} spaces (should be multiple of 2)`,
        context: line,
      });
    }

    if (trimmed.startsWith('|')) {
      const pipes = trimmed.split('|').length - 1;

      if (!inTable) {
        inTable = true;
        tableColumns = pipes;
      } else {
        if (pipes !== tableColumns) {
          errors.push({
            line: lineNum,
            column: 1,
            message: `Table column mismatch: expected ${tableColumns - 1} columns, got ${pipes - 1}`,
            context: line,
          });
        }
      }

      if (!trimmed.endsWith('|')) {
        errors.push({
          line: lineNum,
          column: trimmed.length,
          message: 'Table row must end with |',
          context: line,
        });
      }
    } else {
      inTable = false;
      tableColumns = 0;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate token counts
 *
 * @param data - Data to analyze
 * @returns Token estimates for JSON and MINT
 */
export function estimateTokens(data: unknown): TokenEstimate {
  const jsonStr = JSON.stringify(data, null, 2);
  const mintStr = encode(data);

  const jsonTokens = Math.ceil(jsonStr.length / 3.5);
  const mintTokens = Math.ceil(mintStr.length / 3.5);

  const savings = jsonTokens - mintTokens;
  const savingsPercent = Math.round((savings / jsonTokens) * 100);

  return {
    json: jsonTokens,
    mint: mintTokens,
    savings,
    savingsPercent,
  };
}

export default { encode, decode, validate, estimateTokens };