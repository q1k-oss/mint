import { describe, it, expect } from 'vitest';
import { encode, decode, validate, estimateTokens } from '../src/index';

describe('🌿 MINT Format', () => {
  describe('encode', () => {
    describe('primitives', () => {
      it('should encode strings', () => {
        expect(encode({ name: 'Alice' })).toBe('name: Alice');
      });

      it('should encode numbers', () => {
        expect(encode({ count: 42 })).toBe('count: 42');
        expect(encode({ price: 19.99 })).toBe('price: 19.99');
        expect(encode({ negative: -5 })).toBe('negative: -5');
      });

      it('should encode booleans', () => {
        expect(encode({ active: true })).toBe('active: true');
        expect(encode({ deleted: false })).toBe('deleted: false');
      });

      it('should encode null', () => {
        expect(encode({ value: null })).toBe('value: null');
      });

      it('should quote strings with special characters', () => {
        expect(encode({ msg: 'Hello, World!' })).toBe('msg: "Hello, World!"');
        expect(encode({ path: 'a|b' })).toBe('path: "a|b"');
      });

      it('should quote numeric strings', () => {
        expect(encode({ code: '42' })).toBe('code: "42"');
      });

      it('should quote boolean-like strings', () => {
        expect(encode({ flag: 'true' })).toBe('flag: "true"');
        expect(encode({ flag: 'false' })).toBe('flag: "false"');
      });
    });

    describe('objects', () => {
      it('should encode simple objects', () => {
        const result = encode({ id: 123, name: 'Alice' });
        expect(result).toBe('id: 123\nname: Alice');
      });

      it('should encode nested objects', () => {
        const result = encode({ user: { id: 1, name: 'Alice' } });
        expect(result).toContain('user:');
        expect(result).toContain('  id: 1');
        expect(result).toContain('  name: Alice');
      });

      it('should encode deeply nested objects', () => {
        const result = encode({
          config: { database: { host: 'localhost', port: 5432 } },
        });
        expect(result).toContain('config:');
        expect(result).toContain('  database:');
        expect(result).toContain('    host: localhost');
      });

      it('should encode empty objects', () => {
        expect(encode({ metadata: {} })).toBe('metadata:');
      });
    });

    describe('arrays', () => {
      it('should encode primitive arrays inline', () => {
        expect(encode({ tags: ['a', 'b', 'c'] })).toBe('tags: a, b, c');
        expect(encode({ nums: [1, 2, 3] })).toBe('nums: 1, 2, 3');
      });

      it('should encode empty arrays', () => {
        expect(encode({ items: [] })).toBe('items: []');
      });

      it('should encode arrays of objects as tables', () => {
        const result = encode({
          users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        });
        expect(result).toContain('users:');
        expect(result).toContain('| id | name  |');
        expect(result).toContain('| 1  | Alice |');
        expect(result).toContain('| 2  | Bob   |');
      });

      it('should handle null values in tables', () => {
        const result = encode({
          items: [
            { id: 1, value: 'test' },
            { id: 2, value: null },
          ],
        });
        expect(result).toContain('| 1  | test  |');
        expect(result).toContain('| 2  | -     |');
      });

      it('should align table columns', () => {
        const result = encode({
          products: [
            { sku: 'A', name: 'Widget' },
            { sku: 'LONG-SKU', name: 'Gadget' },
          ],
        });
        const lines = result.split('\n');
        const headerPipes = lines[1].split('|').length;
        const row1Pipes = lines[2].split('|').length;
        expect(headerPipes).toBe(row1Pipes);
      });
    });

    describe('compact mode', () => {
      it('should convert status words to symbols', () => {
        const result = encode(
          {
            items: [
              { id: 1, status: 'completed' },
              { id: 2, status: 'pending' },
              { id: 3, status: 'failed' },
            ],
          },
          { compact: true }
        );
        expect(result).toContain('✓');
        expect(result).toContain('⏳');
        expect(result).toContain('✗');
      });
    });

    describe('options', () => {
      it('should respect custom indent', () => {
        const result = encode({ user: { name: 'Alice' } }, { indent: 4 });
        expect(result).toContain('    name: Alice');
      });

      it('should sort keys when requested', () => {
        const result = encode({ zebra: 1, apple: 2, mango: 3 }, { sortKeys: true });
        const lines = result.split('\n');
        expect(lines[0]).toBe('apple: 2');
        expect(lines[1]).toBe('mango: 3');
        expect(lines[2]).toBe('zebra: 1');
      });
    });
  });

  describe('decode', () => {
    describe('primitives', () => {
      it('should decode strings', () => {
        expect(decode('name: Alice')).toEqual({ name: 'Alice' });
      });

      it('should decode numbers', () => {
        expect(decode('count: 42')).toEqual({ count: 42 });
        expect(decode('price: 19.99')).toEqual({ price: 19.99 });
      });

      it('should decode booleans', () => {
        expect(decode('active: true')).toEqual({ active: true });
        expect(decode('deleted: false')).toEqual({ deleted: false });
      });

      it('should decode null', () => {
        expect(decode('value: null')).toEqual({ value: null });
      });

      it('should decode quoted strings', () => {
        expect(decode('msg: "Hello, World!"')).toEqual({ msg: 'Hello, World!' });
      });
    });

    describe('objects', () => {
      it('should decode simple objects', () => {
        const input = `id: 123
name: Alice`;
        expect(decode(input)).toEqual({ id: 123, name: 'Alice' });
      });

      it('should decode nested objects', () => {
        const input = `user:
  id: 1
  name: Alice`;
        expect(decode(input)).toEqual({ user: { id: 1, name: 'Alice' } });
      });
    });

    describe('arrays', () => {
      it('should decode inline primitive arrays', () => {
        expect(decode('tags: a, b, c')).toEqual({ tags: ['a', 'b', 'c'] });
        expect(decode('nums: 1, 2, 3')).toEqual({ nums: [1, 2, 3] });
      });

      it('should decode tables', () => {
        const input = `users:
  | id | name  |
  | 1  | Alice |
  | 2  | Bob   |`;
        expect(decode(input)).toEqual({
          users: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
        });
      });

      it('should decode null cells in tables', () => {
        const input = `items:
  | id | value |
  | 1  | test  |
  | 2  | -     |`;
        expect(decode(input)).toEqual({
          items: [
            { id: 1, value: 'test' },
            { id: 2, value: null },
          ],
        });
      });
    });

    describe('comments', () => {
      it('should ignore comments', () => {
        const input = `# Comment
name: Alice
# Another
age: 30`;
        expect(decode(input)).toEqual({ name: 'Alice', age: 30 });
      });
    });

    describe('symbols', () => {
      it('should decode status symbols', () => {
        const input = `items:
  | id | status |
  | 1  | ✓      |
  | 2  | ⏳     |`;
        const result = decode(input) as { items: { id: number; status: string }[] };
        expect(result.items[0].status).toBe('true');
        expect(result.items[1].status).toBe('pending');
      });
    });
  });

  describe('round-trip', () => {
    it('should round-trip simple objects', () => {
      const original = { name: 'Alice', age: 30, active: true };
      expect(decode(encode(original))).toEqual(original);
    });

    it('should round-trip nested objects', () => {
      const original = {
        user: { id: 1, profile: { name: 'Alice', theme: 'dark' } },
      };
      expect(decode(encode(original))).toEqual(original);
    });

    it('should round-trip arrays of objects', () => {
      const original = {
        users: [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 2, name: 'Bob', role: 'user' },
        ],
      };
      expect(decode(encode(original))).toEqual(original);
    });

    it('should round-trip complex structures', () => {
      const original = {
        workflow: { id: 'wf_123', name: 'Test', status: 'active' },
        steps: [
          { id: 1, tool: 'search', status: 'completed' },
          { id: 2, tool: 'process', status: 'pending' },
        ],
        tags: ['test', 'workflow'],
      };
      expect(decode(encode(original))).toEqual(original);
    });
  });

  describe('validate', () => {
    it('should validate correct MINT format', () => {
      const input = `name: Alice
items:
  | id | value |
  | 1  | test  |`;
      expect(validate(input).valid).toBe(true);
    });

    it('should detect inconsistent indentation', () => {
      const input = `user:
   name: Alice`;
      const result = validate(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('indentation'))).toBe(true);
    });

    it('should detect table column mismatches', () => {
      const input = `items:
  | id | name  | value |
  | 1  | test  |`;
      const result = validate(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('column'))).toBe(true);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate token savings', () => {
      const data = {
        users: [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 2, name: 'Bob', role: 'user' },
        ],
      };
      const estimate = estimateTokens(data);
      expect(estimate.json).toBeGreaterThan(estimate.mint);
      expect(estimate.savings).toBeGreaterThan(0);
      expect(estimate.savingsPercent).toBeGreaterThan(0);
    });
  });
});

describe('edge cases', () => {
  it('should handle empty input', () => {
    expect(decode('')).toEqual({});
    expect(decode('   ')).toEqual({});
  });

  it('should handle root-level primitives', () => {
    expect(encode(null)).toBe('null');
    expect(encode(42)).toBe('42');
  });

  it('should handle root-level arrays', () => {
    expect(encode([1, 2, 3])).toBe('_: 1, 2, 3');
  });

  it('should handle unicode', () => {
    const data = { greeting: 'Hello 👋 World' };
    expect(decode(encode(data))).toEqual(data);
  });

  it('should handle URLs without quoting', () => {
    const data = { url: 'https://example.com/path' };
    expect(encode(data)).toBe('url: https://example.com/path');
  });
});

describe('real-world: agentic workflow', () => {
  it('should handle workflow data', () => {
    const workflow = {
      workflow: {
        id: 'wf_reconciliation',
        name: 'Invoice Reconciliation',
        status: 'awaiting_review',
      },
      steps: [
        { id: 1, tool: 'gmail_search', status: 'completed', duration: '7s' },
        { id: 2, tool: 'document_parser', status: 'completed', duration: '32s' },
        { id: 3, tool: 'sheets_lookup', status: 'completed', duration: '16s' },
        { id: 4, tool: 'slack_notify', status: 'pending', duration: null },
      ],
      messages: [
        { role: 'user', content: 'Run invoice reconciliation' },
        { role: 'assistant', content: 'Starting process...' },
      ],
    };

    const encoded = encode(workflow);
    const decoded = decode(encoded);

    expect(decoded).toEqual(workflow);

    const estimate = estimateTokens(workflow);
    expect(estimate.savingsPercent).toBeGreaterThan(30);
  });
});
