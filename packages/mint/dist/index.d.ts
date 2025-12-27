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
};

export { type DecodeOptions, type EncodeOptions, type TokenEstimate, type ValidationError, type ValidationResult, decode, _default as default, encode, estimateTokens, validate };
