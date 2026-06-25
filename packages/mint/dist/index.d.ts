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
interface MintDocTable {
    caption?: string;
    headers: string[];
    rows: string[][];
}
interface MintDocList {
    ordered: boolean;
    items: string[];
}
interface MintDocFigure {
    caption?: string;
    /** 1-based page number the figure appears on, if known. */
    page?: number;
}
type MintDocBlock = {
    type: "text";
    text: string;
} | {
    type: "table";
    table: MintDocTable;
} | {
    type: "list";
    list: MintDocList;
} | {
    type: "figure";
    figure: MintDocFigure;
};
interface MintSection {
    heading: string;
    /** Heading depth, 1-based. Hierarchy is implied by level, Markdown-style. */
    level: number;
    blocks: MintDocBlock[];
}
interface MintDocument {
    title?: string;
    metadata?: Record<string, string | number>;
    sections: MintSection[];
}
/**
 * Encode a parsed document into MINT document notation.
 */
declare function encodeDocument(doc: MintDocument): string;
/**
 * Decode MINT document notation back into a MintDocument. Inverse of
 * {@link encodeDocument}.
 */
declare function decodeDocument(input: string): MintDocument;

/**
 * 🌿 MINT Format - Minimal Inference Notation for Tokens
 *
 * A fresh, human-readable, token-efficient data format for LLM prompts.
 *
 * @packageDocumentation
 */
interface EncodeOptions {
    /** Spaces per indentation level (default: 2) */
    indent?: number;
    /** Enable compact mode with symbols (default: false) */
    compact?: boolean;
    /** Sort object keys alphabetically (default: false) */
    sortKeys?: boolean;
}
interface DecodeOptions {
    /** Enable strict validation (default: true) */
    strict?: boolean;
    /** Expected indentation spaces (default: 2) */
    indent?: number;
}
interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
interface ValidationError {
    line: number;
    column: number;
    message: string;
    context?: string;
}
interface TokenEstimate {
    json: number;
    mint: number;
    savings: number;
    savingsPercent: number;
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
declare function encode(value: unknown, options?: EncodeOptions): string;
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
declare function decode(input: string, options?: DecodeOptions): unknown;
/**
 * Validate MINT syntax
 *
 * @param input - MINT-formatted string
 * @returns Validation result with errors
 */
declare function validate(input: string): ValidationResult;
/**
 * Estimate token counts
 *
 * @param data - Data to analyze
 * @returns Token estimates for JSON and MINT
 */
declare function estimateTokens(data: unknown): TokenEstimate;

declare const _default: {
    encode: typeof encode;
    decode: typeof decode;
    validate: typeof validate;
    estimateTokens: typeof estimateTokens;
    encodeDocument: typeof encodeDocument;
    decodeDocument: typeof decodeDocument;
};

export { type DecodeOptions, type EncodeOptions, type MintDocBlock, type MintDocFigure, type MintDocList, type MintDocTable, type MintDocument, type MintSection, type TokenEstimate, type ValidationError, type ValidationResult, decode, decodeDocument, _default as default, encode, encodeDocument, estimateTokens, validate };
