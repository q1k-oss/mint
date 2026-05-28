/**
 * 🌿 MINT Document — a first-class representation for parsed documents.
 *
 * Tools like Docling parse a PDF/DOCX into a hierarchical document: a title,
 * nested sections (heading + prose), tables, lists, and figures with page
 * references. MINT's object/table syntax can't express that hierarchy
 * compactly, and `#` is reserved for comments — so headings need their own
 * grammar. This module adds a Markdown-flavoured, token-efficient, lossless
 * document encoding on top of MINT, exposed as explicit
 * `encodeDocument` / `decodeDocument` functions so it never destabilises the
 * general-purpose `encode` / `decode`.
 *
 * Grammar (line-oriented):
 *   @title <text>            document title (optional, first)
 *   @meta                    metadata block; indented `key: value` lines
 *     key: value
 *   §<level> <heading>       section heading; level is a positive integer
 *   <prose>                  any non-marker line is prose text
 *   @table[: <caption>]      optional caption for the table that follows
 *   | a | b |                table rows (first row = headers)
 *   - <item>                 unordered list item
 *   1. <item>                ordered list item
 *   @fig: "<caption>" p.<n>  figure (caption and/or page optional)
 *
 * Prose lines that begin with a reserved marker (`§ @ | - ` or `<n>.`) are
 * prefixed with `\` on encode and unescaped on decode, keeping round-trips
 * lossless.
 *
 * @packageDocumentation
 */

export interface MintDocTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface MintDocList {
  ordered: boolean;
  items: string[];
}

export interface MintDocFigure {
  caption?: string;
  /** 1-based page number the figure appears on, if known. */
  page?: number;
}

export type MintDocBlock =
  | { type: "text"; text: string }
  | { type: "table"; table: MintDocTable }
  | { type: "list"; list: MintDocList }
  | { type: "figure"; figure: MintDocFigure };

export interface MintSection {
  heading: string;
  /** Heading depth, 1-based. Hierarchy is implied by level, Markdown-style. */
  level: number;
  blocks: MintDocBlock[];
}

export interface MintDocument {
  title?: string;
  metadata?: Record<string, string | number>;
  sections: MintSection[];
}

const RESERVED_LINE = /^(§|@|\||- |\\|\d+\. )/;

function escapeProse(line: string): string {
  return RESERVED_LINE.test(line) ? `\\${line}` : line;
}

function unescapeProse(line: string): string {
  return line.startsWith("\\") ? line.slice(1) : line;
}

function quote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function unquote(value: string): string {
  const inner = value.slice(1, -1);
  return inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

function renderTable(table: MintDocTable, out: string[]): void {
  if (table.caption) out.push(`@table: ${table.caption}`);
  const widths = table.headers.map((h, i) =>
    Math.max(h.length, ...table.rows.map((r) => (r[i] ?? "").length)),
  );
  const fmtRow = (cells: string[]) =>
    `| ${cells.map((c, i) => (c ?? "").padEnd(widths[i])).join(" | ")} |`;
  out.push(fmtRow(table.headers));
  for (const row of table.rows)
    out.push(fmtRow(table.headers.map((_, i) => row[i] ?? "")));
}

function renderBlock(block: MintDocBlock, out: string[]): void {
  switch (block.type) {
    case "text":
      for (const line of block.text.split("\n")) out.push(escapeProse(line));
      break;
    case "table":
      renderTable(block.table, out);
      break;
    case "list":
      block.list.items.forEach((item, i) =>
        out.push(block.list.ordered ? `${i + 1}. ${item}` : `- ${item}`),
      );
      break;
    case "figure": {
      const parts: string[] = [];
      if (block.figure.caption) parts.push(quote(block.figure.caption));
      if (typeof block.figure.page === "number")
        parts.push(`p.${block.figure.page}`);
      out.push(`@fig:${parts.length ? ` ${parts.join(" ")}` : ""}`);
      break;
    }
  }
}

/**
 * Encode a parsed document into MINT document notation.
 */
export function encodeDocument(doc: MintDocument): string {
  const out: string[] = [];

  if (doc.title) out.push(`@title ${doc.title}`);

  if (doc.metadata && Object.keys(doc.metadata).length > 0) {
    out.push("@meta");
    for (const [key, value] of Object.entries(doc.metadata)) {
      out.push(`  ${key}: ${value}`);
    }
  }

  for (const section of doc.sections) {
    out.push(`§${section.level} ${section.heading}`);
    for (const block of section.blocks) renderBlock(block, out);
  }

  return out.join("\n");
}

interface ParseState {
  text: string[] | null;
  list: { ordered: boolean; items: string[] } | null;
  table: { caption?: string; rows: string[][] } | null;
  pendingTableCaption: string | undefined;
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());
}

/**
 * Decode MINT document notation back into a MintDocument. Inverse of
 * {@link encodeDocument}.
 */
export function decodeDocument(input: string): MintDocument {
  const lines = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const doc: MintDocument = { sections: [] };

  let i = 0;

  // Header: @title + @meta (only valid before the first section).
  if (lines[i]?.startsWith("@title ")) {
    doc.title = lines[i].slice("@title ".length);
    i++;
  }
  if (lines[i] === "@meta") {
    i++;
    const meta: Record<string, string | number> = {};
    while (
      i < lines.length &&
      /^\s+\S/.test(lines[i]) &&
      !lines[i].startsWith("§")
    ) {
      const trimmed = lines[i].trim();
      const colon = trimmed.indexOf(":");
      if (colon === -1) break;
      const key = trimmed.slice(0, colon).trim();
      const raw = trimmed.slice(colon + 1).trim();
      meta[key] = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw;
      i++;
    }
    doc.metadata = meta;
  }

  let current: MintSection | null = null;
  const state: ParseState = {
    text: null,
    list: null,
    table: null,
    pendingTableCaption: undefined,
  };

  const flush = () => {
    if (!current) return;
    if (state.text)
      current.blocks.push({ type: "text", text: state.text.join("\n") });
    if (state.list) current.blocks.push({ type: "list", list: state.list });
    if (state.table) {
      const [headers, ...rows] = state.table.rows;
      current.blocks.push({
        type: "table",
        table: { caption: state.table.caption, headers: headers ?? [], rows },
      });
    }
    state.text = null;
    state.list = null;
    state.table = null;
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = /^§(\d+)\s(.*)$/.exec(line);

    if (headingMatch) {
      flush();
      current = {
        heading: headingMatch[2],
        level: Number(headingMatch[1]),
        blocks: [],
      };
      doc.sections.push(current);
      continue;
    }

    if (!current) continue; // prose before any section is dropped (shouldn't happen)

    if (line.startsWith("@table")) {
      flush();
      const colon = line.indexOf(":");
      state.pendingTableCaption =
        colon !== -1 ? line.slice(colon + 1).trim() || undefined : undefined;
      continue;
    }

    if (line.startsWith("|")) {
      if (!state.table) {
        flush();
        state.table = { caption: state.pendingTableCaption, rows: [] };
        state.pendingTableCaption = undefined;
      }
      state.table.rows.push(splitRow(line));
      continue;
    }

    if (line.startsWith("@fig:")) {
      flush();
      const body = line.slice("@fig:".length).trim();
      const figure: MintDocFigure = {};
      const pageMatch = /\bp\.(\d+)\s*$/.exec(body);
      let rest = body;
      if (pageMatch) {
        figure.page = Number(pageMatch[1]);
        rest = body.slice(0, pageMatch.index).trim();
      }
      if (rest.startsWith('"') && rest.endsWith('"'))
        figure.caption = unquote(rest);
      else if (rest) figure.caption = rest;
      current.blocks.push({ type: "figure", figure });
      continue;
    }

    const orderedMatch = /^(\d+)\.\s(.*)$/.exec(line);
    if (orderedMatch) {
      if (!state.list || !state.list.ordered) {
        flush();
        state.list = { ordered: true, items: [] };
      }
      state.list.items.push(orderedMatch[2]);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!state.list || state.list.ordered) {
        flush();
        state.list = { ordered: false, items: [] };
      }
      state.list.items.push(line.slice(2));
      continue;
    }

    // Prose text (possibly escaped).
    if (!state.text) {
      flush();
      state.text = [];
    }
    state.text.push(unescapeProse(line));
  }

  flush();
  return doc;
}
