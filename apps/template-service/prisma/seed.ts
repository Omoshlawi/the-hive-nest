/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import 'dotenv/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

interface CsvRow {
  key: string;
  type: string;
  name: string;
  description: string;
  engine: string;
  schema: string;
  metadata: string;
  [slotCol: string]: string; // slot_* columns
}

/**
 * Resolves a slot cell value to its final string content.
 *
 * Supported directives:
 *   file:<path>  — reads the file at <path> relative to seedsDir
 *   text:<value> — returns <value> as-is (strips the prefix)
 *   <bare value> — treated as plain text (backward compatible)
 */
function resolveSlotValue(raw: string, seedsDir: string): string {
  if (!raw?.trim()) return '';

  if (raw.startsWith('file:')) {
    const filePath = path.join(seedsDir, raw.slice(5).trim());
    if (!fs.existsSync(filePath)) {
      throw new Error(`Slot file not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf-8').trim();
  }

  if (raw.startsWith('text:')) {
    return raw.slice(5); // strip prefix, preserve exact value including leading spaces
  }

  return raw; // no prefix → plain text
}

function buildSlots(row: CsvRow, seedsDir: string): Record<string, string> {
  const slots: Record<string, string> = {};
  for (const [col, value] of Object.entries(row)) {
    if (col.startsWith('slot_') && value?.trim()) {
      const resolved = resolveSlotValue(value, seedsDir);
      if (resolved) slots[col.replace(/^slot_/, '')] = resolved;
    }
  }
  return slots;
}

function parseJson<T>(raw: string, fallback: T): T {
  if (!raw?.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`  ⚠ Invalid JSON (using fallback): ${raw.slice(0, 60)}...`);
    return fallback;
  }
}

async function main() {
  const seedsDir = path.join(__dirname, 'seeds');
  const csvPath = path.join(seedsDir, 'templates.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');

  const rows: CsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  console.log(`Seeding ${rows.length} system templates from CSV...`);

  for (const row of rows) {
    if (!row.key) {
      console.warn('  ⚠ Skipping row with empty key');
      continue;
    }

    const slots = buildSlots(row, seedsDir);
    const schema = parseJson<object | null>(row.schema, null);
    const metadata = parseJson<object | null>(row.metadata, null);

    const jsonField = (v: object | null): any => v;

    await prisma.template.upsert({
      where: { key: row.key },
      update: {
        name: row.name,
        description: row.description || null,
        slots,
        schema: jsonField(schema),
        metadata: jsonField(metadata),
      },
      create: {
        key: row.key,
        type: row.type,
        name: row.name,
        description: row.description || null,
        engine: (row.engine as 'HANDLEBARS') || 'HANDLEBARS',
        slots,
        schema: jsonField(schema),
        metadata: jsonField(metadata),
      },
    });

    console.log(`  ✓ ${row.key} (${Object.keys(slots).join(', ')})`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
