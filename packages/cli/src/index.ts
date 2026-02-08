#!/usr/bin/env node

/**
 * 🌿 MINT Format CLI
 *
 * Command-line tool for converting between JSON and MINT formats
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { encode, decode, validate, estimateTokens } from '@q1k-oss/mint-format';

interface CliOptions {
  input?: string;
  output?: string;
  encode?: boolean;
  decode?: boolean;
  compact?: boolean;
  indent?: number;
  stats?: boolean;
  strict?: boolean;
  validate?: boolean;
  help?: boolean;
  version?: boolean;
}

const VERSION = '1.0.0';

const HELP_TEXT = `
🌿 MINT Format CLI v${VERSION}

Usage: mint [options] [input]

Convert between JSON and MINT formats.

Arguments:
  input                Input file path (or - for stdin)

Options:
  -o, --output <file>  Output file path (stdout if omitted)
  -e, --encode         Force encode mode (JSON → MINT)
  -d, --decode         Force decode mode (MINT → JSON)
  --compact            Enable compact mode with symbols
  --indent <n>         Indentation spaces (default: 2)
  --stats              Show token count and savings
  --strict             Enable strict validation
  --validate           Validate input without conversion
  -h, --help           Show this help message
  -v, --version        Show version number

Examples:
  # Convert JSON to MINT
  mint input.json -o output.mint

  # Convert MINT to JSON
  mint input.mint -o output.json

  # Pipe from stdin
  cat data.json | mint > output.mint

  # Show token savings
  mint data.json --stats

  # Validate MINT syntax
  mint --validate input.mint
`;

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case '-o':
      case '--output':
        options.output = args[++i];
        break;
      case '-e':
      case '--encode':
        options.encode = true;
        break;
      case '-d':
      case '--decode':
        options.decode = true;
        break;
      case '--compact':
        options.compact = true;
        break;
      case '--indent':
        options.indent = parseInt(args[++i], 10);
        break;
      case '--stats':
        options.stats = true;
        break;
      case '--strict':
        options.strict = true;
        break;
      case '--validate':
        options.validate = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-v':
      case '--version':
        options.version = true;
        break;
      default:
        if (!arg.startsWith('-')) {
          options.input = arg;
        }
        break;
    }
    i++;
  }

  return options;
}

function readInput(inputPath?: string): string {
  if (!inputPath || inputPath === '-') {
    return readFileSync(0, 'utf-8');
  }

  const fullPath = resolve(inputPath);
  if (!existsSync(fullPath)) {
    console.error(`❌ Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  return readFileSync(fullPath, 'utf-8');
}

function writeOutput(content: string, outputPath?: string): void {
  if (!outputPath) {
    process.stdout.write(content);
    if (!content.endsWith('\n')) {
      process.stdout.write('\n');
    }
    return;
  }

  const fullPath = resolve(outputPath);
  writeFileSync(fullPath, content + '\n', 'utf-8');
  console.error(`🌿 Written to: ${outputPath}`);
}

function detectMode(inputPath: string | undefined, options: CliOptions): 'encode' | 'decode' {
  if (options.encode) return 'encode';
  if (options.decode) return 'decode';

  if (inputPath && inputPath !== '-') {
    const ext = extname(inputPath).toLowerCase();
    if (ext === '.json') return 'encode';
    if (ext === '.mint') return 'decode';
  }

  if (options.output) {
    const ext = extname(options.output).toLowerCase();
    if (ext === '.mint') return 'encode';
    if (ext === '.json') return 'decode';
  }

  return 'encode';
}

function showStats(input: string, output: string, mode: 'encode' | 'decode'): void {
  const jsonStr = mode === 'encode' ? input : output;
  const mintStr = mode === 'encode' ? output : input;

  const jsonTokens = Math.ceil(jsonStr.length / 3.5);
  const mintTokens = Math.ceil(mintStr.length / 3.5);
  const savings = jsonTokens - mintTokens;
  const savingsPercent = Math.round((savings / jsonTokens) * 100);

  console.error('\n🌿 ─── Token Statistics ───');
  console.error(`   JSON:    ~${jsonTokens} tokens (${jsonStr.length} chars)`);
  console.error(`   MINT:    ~${mintTokens} tokens (${mintStr.length} chars)`);
  console.error(`   Savings: ~${savings} tokens (${savingsPercent}%)`);
  console.error('───────────────────────────\n');
}

function main(): void {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  if (options.version) {
    console.log(`🌿 MINT Format v${VERSION}`);
    process.exit(0);
  }

  try {
    const input = readInput(options.input);

    if (options.validate) {
      const result = validate(input);
      if (result.valid) {
        console.log('🌿 ✓ Valid MINT format');
        process.exit(0);
      } else {
        console.error('❌ Invalid MINT format\n');
        for (const error of result.errors) {
          console.error(`  Line ${error.line}: ${error.message}`);
          if (error.context) {
            console.error(`    ${error.context}`);
          }
        }
        process.exit(1);
      }
      return;
    }

    const mode = detectMode(options.input, options);

    let output: string;

    if (mode === 'encode') {
      let data: unknown;
      try {
        data = JSON.parse(input);
      } catch (e) {
        console.error('❌ Error: Invalid JSON input');
        console.error((e as Error).message);
        process.exit(1);
      }

      output = encode(data, {
        indent: options.indent ?? 2,
        compact: options.compact ?? false,
      });
    } else {
      let data: unknown;
      try {
        data = decode(input, {
          strict: options.strict ?? true,
          indent: options.indent ?? 2,
        });
      } catch (e) {
        console.error('❌ Error: Invalid MINT input');
        console.error((e as Error).message);
        process.exit(1);
      }

      output = JSON.stringify(data, null, 2);
    }

    if (options.stats) {
      showStats(input, output, mode);
    }

    writeOutput(output, options.output);
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

main();
