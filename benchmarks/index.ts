/**
 * 🌿 MINT Format Benchmarks
 *
 * Compares token efficiency and performance across formats
 */

import { encode, decode, estimateTokens } from '@mint-format/mint';

const datasets = {
  employees: {
    name: 'Employee Records (100 rows)',
    data: {
      employees: Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `Employee ${i + 1}`,
        email: `employee${i + 1}@company.com`,
        department: ['Engineering', 'Marketing', 'Sales', 'HR'][i % 4],
        salary: 50000 + Math.floor(Math.random() * 50000),
        active: Math.random() > 0.2,
      })),
    },
  },

  workflow: {
    name: 'Agentic Workflow',
    data: {
      workflow: {
        id: 'wf_reconciliation',
        name: 'Invoice Reconciliation',
        status: 'awaiting_review',
        owner: { id: 'usr_hm4n5hu', name: 'Himanshu', role: 'admin' },
      },
      steps: [
        { id: 1, tool: 'gmail_search', status: 'completed', duration: '7s', output: 'Found 23 emails' },
        { id: 2, tool: 'document_parser', status: 'completed', duration: '32s', output: 'Parsed 21 docs' },
        { id: 3, tool: 'sheets_lookup', status: 'completed', duration: '16s', output: 'Matched 18 POs' },
        { id: 4, tool: 'discrepancy_check', status: 'completed', duration: '8s', output: 'Flagged 3 issues' },
        { id: 5, tool: 'slack_notify', status: 'pending', duration: null, output: null },
      ],
      messages: [
        { role: 'user', content: 'Run invoice reconciliation for SA-DXB-01' },
        { role: 'assistant', content: 'Starting reconciliation process...' },
        { role: 'assistant', content: 'Found 3 discrepancies. Please review.' },
      ],
      errors: [
        { step: 2, code: 'PARSE_FAILED', message: 'Could not extract table', file: 'INV-0892.pdf' },
        { step: 2, code: 'PARSE_FAILED', message: 'Corrupted file', file: 'INV-0901.pdf' },
      ],
    },
  },

  apiResponse: {
    name: 'API Response (50 items)',
    data: {
      status: 'success',
      meta: { page: 1, perPage: 50, total: 1234, totalPages: 25 },
      data: Array.from({ length: 50 }, (_, i) => ({
        id: `item_${i + 1}`,
        title: `Product ${i + 1}`,
        description: `Description for product ${i + 1}`,
        price: Math.floor(Math.random() * 10000) / 100,
        inStock: Math.random() > 0.3,
        category: ['Electronics', 'Clothing', 'Home', 'Books'][i % 4],
      })),
    },
  },

  nestedConfig: {
    name: 'Nested Configuration',
    data: {
      app: { name: 'MyApp', version: '2.1.0', env: 'production' },
      database: {
        primary: {
          host: 'db.example.com',
          port: 5432,
          name: 'myapp_prod',
          pool: { min: 5, max: 20, idle: 10000 },
        },
        replica: { host: 'db-replica.example.com', port: 5432, name: 'myapp_prod' },
      },
      cache: { enabled: true, provider: 'redis', ttl: 3600, prefix: 'myapp:' },
      features: { darkMode: true, betaFeatures: false, maxUploadSize: 10485760 },
    },
  },
};

interface BenchmarkResult {
  dataset: string;
  jsonTokens: number;
  jsonChars: number;
  mintTokens: number;
  mintChars: number;
  savings: number;
  savingsPercent: number;
  encodeTimeMs: number;
  decodeTimeMs: number;
}

function benchmark(name: string, data: unknown): BenchmarkResult {
  const jsonStr = JSON.stringify(data, null, 2);

  const encodeStart = performance.now();
  const mintStr = encode(data);
  const encodeEnd = performance.now();

  const decodeStart = performance.now();
  decode(mintStr);
  const decodeEnd = performance.now();

  const jsonTokens = Math.ceil(jsonStr.length / 3.5);
  const mintTokens = Math.ceil(mintStr.length / 3.5);

  return {
    dataset: name,
    jsonTokens,
    jsonChars: jsonStr.length,
    mintTokens,
    mintChars: mintStr.length,
    savings: jsonTokens - mintTokens,
    savingsPercent: Math.round(((jsonTokens - mintTokens) / jsonTokens) * 100),
    encodeTimeMs: Math.round((encodeEnd - encodeStart) * 100) / 100,
    decodeTimeMs: Math.round((decodeEnd - decodeStart) * 100) / 100,
  };
}

function formatBar(value: number, max: number, width = 40): string {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function runBenchmarks(): void {
  console.log('\n🌿 ════════════════════════════════════════════════════════════════');
  console.log('                      MINT Format Benchmarks                        ');
  console.log('════════════════════════════════════════════════════════════════════\n');

  const results: BenchmarkResult[] = [];

  for (const [key, { name, data }] of Object.entries(datasets)) {
    const result = benchmark(name, data);
    results.push(result);
  }

  // Token comparison
  console.log('📊 Token Comparison\n');
  console.log('─'.repeat(70));

  const maxTokens = Math.max(...results.map((r) => r.jsonTokens));

  for (const result of results) {
    console.log(`\n${result.dataset}`);
    console.log(`  JSON: ${formatBar(result.jsonTokens, maxTokens, 35)} ${result.jsonTokens} tokens`);
    console.log(
      `  MINT: ${formatBar(result.mintTokens, maxTokens, 35)} ${result.mintTokens} tokens (-${result.savingsPercent}%)`
    );
  }

  // Summary table
  console.log('\n\n📋 Summary\n');
  console.log('─'.repeat(90));
  console.log(
    'Dataset'.padEnd(30) +
      'JSON'.padStart(10) +
      'MINT'.padStart(10) +
      'Savings'.padStart(12) +
      'Encode'.padStart(12) +
      'Decode'.padStart(12)
  );
  console.log('─'.repeat(90));

  for (const result of results) {
    console.log(
      result.dataset.slice(0, 28).padEnd(30) +
        `${result.jsonTokens}`.padStart(10) +
        `${result.mintTokens}`.padStart(10) +
        `${result.savingsPercent}%`.padStart(12) +
        `${result.encodeTimeMs}ms`.padStart(12) +
        `${result.decodeTimeMs}ms`.padStart(12)
    );
  }

  console.log('─'.repeat(90));

  const avgSavings = Math.round(results.reduce((sum, r) => sum + r.savingsPercent, 0) / results.length);
  const totalJsonTokens = results.reduce((sum, r) => sum + r.jsonTokens, 0);
  const totalMintTokens = results.reduce((sum, r) => sum + r.mintTokens, 0);

  console.log(
    'TOTAL'.padEnd(30) +
      `${totalJsonTokens}`.padStart(10) +
      `${totalMintTokens}`.padStart(10) +
      `${avgSavings}%`.padStart(12)
  );

  console.log('\n\n🌿 Average token savings: ' + avgSavings + '%');
  console.log('🌿 Total tokens saved: ' + (totalJsonTokens - totalMintTokens));
  console.log('\n');
}

runBenchmarks();
