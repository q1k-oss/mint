// src/index.ts
var STATUS_SYMBOLS = {
  completed: "\u2713",
  complete: "\u2713",
  success: "\u2713",
  done: "\u2713",
  passed: "\u2713",
  true: "\u2713",
  yes: "\u2713",
  failed: "\u2717",
  failure: "\u2717",
  error: "\u2717",
  rejected: "\u2717",
  false: "\u2717",
  no: "\u2717",
  pending: "\u23F3",
  waiting: "\u23F3",
  in_progress: "\u23F3",
  running: "\u23F3",
  warning: "\u26A0",
  warn: "\u26A0",
  review: "?",
  unknown: "?"
};
var REVERSE_SYMBOLS = {
  "\u2713": "true",
  "\u2717": "false",
  "\u23F3": "pending",
  "\u26A0": "warning",
  "?": "unknown"
};
function needsQuoting(value) {
  if (value === "") return true;
  if (value.startsWith(" ") || value.endsWith(" ")) return true;
  if (value.includes("|") || value.includes("\n") || value.includes("\r")) return true;
  if (value.includes(",")) return true;
  if (/^-?\d+\.?\d*$/.test(value)) return true;
  if (["true", "false", "null"].includes(value.toLowerCase())) return true;
  if (value.includes(":") && !value.includes("://")) return true;
  if (value.includes('"')) return true;
  return false;
}
function escapeString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}
function unescapeString(value) {
  return value.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\\t/g, "	").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}
function formatPrimitive(value, options, inTable = false) {
  if (value === null || value === void 0) {
    return inTable ? "-" : "null";
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "number") {
    if (!isFinite(value)) return "null";
    return String(value);
  }
  if (typeof value === "string") {
    if (options.compact && STATUS_SYMBOLS[value.toLowerCase()]) {
      return STATUS_SYMBOLS[value.toLowerCase()];
    }
    if (value === "" && inTable) return "-";
    if (needsQuoting(value)) {
      return `"${escapeString(value)}"`;
    }
    return value;
  }
  return String(value);
}
function isPrimitive(value) {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function isTableArray(arr) {
  if (arr.length === 0) return false;
  if (!arr.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))) {
    return false;
  }
  const firstKeys = Object.keys(arr[0]).sort().join(",");
  const sameKeys = arr.every((item) => {
    const keys = Object.keys(item).sort().join(",");
    return keys === firstKeys;
  });
  if (!sameKeys) return false;
  return arr.every((item) => {
    const obj = item;
    return Object.values(obj).every((val) => isPrimitive(val));
  });
}
function isPrimitiveArray(arr) {
  return arr.every((item) => isPrimitive(item));
}
function getColumnWidths(headers, rows) {
  const widths = headers.map((h) => h.length);
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      widths[i] = Math.max(widths[i] || 0, row[i]?.length || 0);
    }
  }
  return widths;
}
function padCell(value, width) {
  return value + " ".repeat(Math.max(0, width - value.length));
}
function encodeTable(arr, options, indentLevel) {
  if (arr.length === 0) return "| |";
  const indent = " ".repeat(options.indent || 2);
  const baseIndent = indent.repeat(indentLevel);
  const headers = Object.keys(arr[0]);
  const rows = arr.map((obj) => headers.map((h) => formatPrimitive(obj[h], options, true)));
  const widths = getColumnWidths(headers, rows);
  const lines = [];
  const headerCells = headers.map((h, i) => padCell(h, widths[i]));
  lines.push(`${baseIndent}| ${headerCells.join(" | ")} |`);
  for (const row of rows) {
    const cells = row.map((cell, i) => padCell(cell, widths[i]));
    lines.push(`${baseIndent}| ${cells.join(" | ")} |`);
  }
  return lines.join("\n");
}
function encodeValue(value, options, indentLevel) {
  const indent = " ".repeat(options.indent || 2);
  const baseIndent = indent.repeat(indentLevel);
  if (value === null || typeof value !== "object") {
    return formatPrimitive(value, options);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    if (isPrimitiveArray(value)) {
      return value.map((v) => formatPrimitive(v, options)).join(", ");
    }
    if (isTableArray(value)) {
      return "\n" + encodeTable(value, options, indentLevel + 1);
    }
    const lines2 = [];
    for (const item of value) {
      if (item === null || typeof item !== "object") {
        lines2.push(`${baseIndent}${indent}- ${formatPrimitive(item, options)}`);
      } else {
        const encoded = encodeValue(item, options, indentLevel + 2);
        if (encoded.includes("\n")) {
          lines2.push(`${baseIndent}${indent}-`);
          lines2.push(encoded);
        } else {
          lines2.push(`${baseIndent}${indent}- ${encoded}`);
        }
      }
    }
    return "\n" + lines2.join("\n");
  }
  const obj = value;
  const keys = options.sortKeys ? Object.keys(obj).sort() : Object.keys(obj);
  if (keys.length === 0) {
    return "";
  }
  const lines = [];
  for (const key of keys) {
    const val = obj[key];
    if (val === null) {
      lines.push(`${baseIndent}${key}: null`);
    } else if (typeof val !== "object") {
      lines.push(`${baseIndent}${key}: ${formatPrimitive(val, options)}`);
    } else if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${baseIndent}${key}: []`);
      } else if (isPrimitiveArray(val)) {
        lines.push(`${baseIndent}${key}: ${val.map((v) => formatPrimitive(v, options)).join(", ")}`);
      } else {
        lines.push(`${baseIndent}${key}:${encodeValue(val, options, indentLevel)}`);
      }
    } else {
      const nested = encodeValue(val, options, indentLevel + 1);
      if (nested === "") {
        lines.push(`${baseIndent}${key}:`);
      } else if (nested.includes("\n")) {
        lines.push(`${baseIndent}${key}:`);
        lines.push(nested);
      } else {
        lines.push(`${baseIndent}${key}: ${nested}`);
      }
    }
  }
  return lines.join("\n");
}
function encode(value, options = {}) {
  const opts = {
    indent: 2,
    compact: false,
    sortKeys: false,
    ...options
  };
  if (value === null || value === void 0) {
    return "null";
  }
  if (typeof value !== "object") {
    return formatPrimitive(value, opts);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "_: []";
    if (isPrimitiveArray(value)) {
      return `_: ${value.map((v) => formatPrimitive(v, opts)).join(", ")}`;
    }
    if (isTableArray(value)) {
      return `_:
${encodeTable(value, opts, 1)}`;
    }
    return `_:${encodeValue(value, opts, 0)}`;
  }
  return encodeValue(value, opts, 0);
}
function parsePrimitive(value) {
  const trimmed = value.trim();
  if (trimmed === "null" || trimmed === "-" || trimmed === "") {
    return null;
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
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
function parseTable(lines, startIndex, indent) {
  const result = [];
  let headers = [];
  let i = startIndex;
  const headerLine = lines[i].trim();
  if (!headerLine.startsWith("|")) {
    return { value: [], endIndex: startIndex };
  }
  headers = headerLine.split("|").slice(1, -1).map((h) => h.trim());
  i++;
  while (i < lines.length) {
    const line = lines[i];
    const lineIndent = line.length - line.trimStart().length;
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      break;
    }
    if (lineIndent < indent && trimmed !== "") {
      break;
    }
    const cells = trimmed.split("|").slice(1, -1).map((c) => parsePrimitive(c.trim()));
    if (cells.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cells[idx];
      });
      result.push(row);
    }
    i++;
  }
  return { value: result, endIndex: i - 1 };
}
function parseDocument(lines, startIndex, baseIndent, options) {
  const result = {};
  let i = startIndex;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) {
      i++;
      continue;
    }
    const lineIndent = line.length - line.trimStart().length;
    if (lineIndent < baseIndent) {
      break;
    }
    if (lineIndent > baseIndent) {
      i++;
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("|")) {
      i++;
      continue;
    }
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) {
      i++;
      continue;
    }
    const key = trimmed.slice(0, colonIndex).trim();
    const valueStr = trimmed.slice(colonIndex + 1).trim();
    if (valueStr === "" || valueStr === "[]") {
      let foundNested = false;
      let nextIdx = i + 1;
      while (nextIdx < lines.length && lines[nextIdx].trim() === "") {
        nextIdx++;
      }
      if (nextIdx < lines.length) {
        const nextLine = lines[nextIdx];
        const nextIndent = nextLine.length - nextLine.trimStart().length;
        const nextTrimmed = nextLine.trim();
        if (nextIndent > baseIndent && nextTrimmed.startsWith("|")) {
          const tableResult = parseTable(lines, nextIdx, nextIndent);
          result[key] = tableResult.value;
          i = tableResult.endIndex + 1;
          foundNested = true;
        } else if (nextIndent > baseIndent && nextTrimmed !== "" && !nextTrimmed.startsWith("#")) {
          const nestedResult = parseDocument(lines, nextIdx, nextIndent, options);
          result[key] = nestedResult.value;
          i = nestedResult.endIndex;
          foundNested = true;
        }
      }
      if (!foundNested) {
        result[key] = valueStr === "[]" ? [] : {};
        i++;
      }
    } else if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
      result[key] = parsePrimitive(valueStr);
      i++;
    } else if (valueStr.includes(" | ")) {
      result[key] = valueStr.split(" | ").map((v) => parsePrimitive(v.trim()));
      i++;
    } else if (valueStr.includes(", ")) {
      result[key] = valueStr.split(", ").map((v) => parsePrimitive(v.trim()));
      i++;
    } else {
      result[key] = parsePrimitive(valueStr);
      i++;
    }
  }
  return { value: result, endIndex: i };
}
function decode(input, options = {}) {
  const opts = {
    strict: true,
    indent: 2,
    ...options
  };
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  if (lines.every((l) => l.trim() === "" || l.trim().startsWith("#"))) {
    return {};
  }
  let startIndex = 0;
  while (startIndex < lines.length && (lines[startIndex].trim() === "" || lines[startIndex].trim().startsWith("#"))) {
    startIndex++;
  }
  if (startIndex >= lines.length) {
    return {};
  }
  const firstLine = lines[startIndex].trim();
  if (firstLine.startsWith("|")) {
    const tableResult = parseTable(lines, startIndex, 0);
    return tableResult.value;
  }
  if (firstLine.startsWith("_:")) {
    const valueStr = firstLine.slice(2).trim();
    if (valueStr === "" || valueStr === "[]") {
      const nextLine = lines[startIndex + 1];
      if (nextLine && nextLine.trim().startsWith("|")) {
        const tableResult = parseTable(lines, startIndex + 1, 2);
        return tableResult.value;
      }
      return [];
    }
    if (valueStr.includes(", ")) {
      return valueStr.split(", ").map((v) => parsePrimitive(v.trim()));
    }
    return [parsePrimitive(valueStr)];
  }
  const result = parseDocument(lines, startIndex, 0, opts);
  return result.value;
}
function validate(input) {
  const errors = [];
  const lines = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let inTable = false;
  let tableColumns = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const indent = line.length - line.trimStart().length;
    if (indent % 2 !== 0) {
      errors.push({
        line: lineNum,
        column: 1,
        message: `Inconsistent indentation: ${indent} spaces (should be multiple of 2)`,
        context: line
      });
    }
    if (trimmed.startsWith("|")) {
      const pipes = trimmed.split("|").length - 1;
      if (!inTable) {
        inTable = true;
        tableColumns = pipes;
      } else {
        if (pipes !== tableColumns) {
          errors.push({
            line: lineNum,
            column: 1,
            message: `Table column mismatch: expected ${tableColumns - 1} columns, got ${pipes - 1}`,
            context: line
          });
        }
      }
      if (!trimmed.endsWith("|")) {
        errors.push({
          line: lineNum,
          column: trimmed.length,
          message: "Table row must end with |",
          context: line
        });
      }
    } else {
      inTable = false;
      tableColumns = 0;
    }
  }
  return {
    valid: errors.length === 0,
    errors
  };
}
function estimateTokens(data) {
  const jsonStr = JSON.stringify(data, null, 2);
  const mintStr = encode(data);
  const jsonTokens = Math.ceil(jsonStr.length / 3.5);
  const mintTokens = Math.ceil(mintStr.length / 3.5);
  const savings = jsonTokens - mintTokens;
  const savingsPercent = Math.round(savings / jsonTokens * 100);
  return {
    json: jsonTokens,
    mint: mintTokens,
    savings,
    savingsPercent
  };
}
var index_default = { encode, decode, validate, estimateTokens };
export {
  decode,
  index_default as default,
  encode,
  estimateTokens,
  validate
};
