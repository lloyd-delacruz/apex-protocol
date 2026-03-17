/**
 * importExercises.ts — CLI script
 *
 * Fetches exercises from ExerciseDB (RapidAPI) and stores them in PostgreSQL.
 *
 * Usage:
 *   npm run exercises:import
 *   npm run exercises:import -- --body-part chest
 *   npm run exercises:import -- --equipment barbell
 *   npm run exercises:import -- --page-size 50 --max-pages 3
 *   npm run exercises:import -- --dry-run
 *
 * Flags:
 *   --body-part <string>    Import only a specific body-part category.
 *   --equipment <string>    Import only a specific equipment category.
 *   --page-size  <number>   Exercises per API page (default 100).
 *   --max-pages  <number>   Maximum pages to fetch (omit for full import).
 *   --delay-ms   <number>   Delay between API pages in ms (default 500).
 *   --dry-run               Normalise and count without writing to the database.
 *
 * Required environment variables (in .env):
 *   EXERCISEDB_API_KEY
 *   EXERCISEDB_API_HOST
 *   EXERCISEDB_BASE_URL
 */

// Load .env before anything else so process.env is populated for all services
import * as dotenv from 'dotenv';
import * as path   from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import prisma from '../db/prisma';
import { ExerciseImportService, ImportResult } from '../services/ExerciseImportService';
import { ExerciseDbService }                   from '../services/ExerciseDbService';

// ─── CLI arg parser ───────────────────────────────────────────────────────────

interface CliArgs {
  bodyPart:  string | null;
  equipment: string | null;
  pageSize:  number;
  maxPages:  number | undefined;
  delayMs:   number;
  dryRun:    boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    bodyPart:  null,
    equipment: null,
    pageSize:  100,
    maxPages:  undefined,
    delayMs:   500,
    dryRun:    false,
  };

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const next = argv[i + 1];

    switch (flag) {
      case '--body-part':
        args.bodyPart = next ?? null;
        i++;
        break;
      case '--equipment':
        args.equipment = next ?? null;
        i++;
        break;
      case '--page-size':
        args.pageSize = parseInt(next ?? '100', 10);
        i++;
        break;
      case '--max-pages':
        args.maxPages = parseInt(next ?? '0', 10);
        i++;
        break;
      case '--delay-ms':
        args.delayMs = parseInt(next ?? '500', 10);
        i++;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
    }
  }

  return args;
}

// ─── Output helpers ───────────────────────────────────────────────────────────

const DIVIDER = '─'.repeat(48);

function printHeader(): void {
  console.log('');
  console.log(DIVIDER);
  console.log('  Apex Protocol — ExerciseDB Import');
  console.log(DIVIDER);
}

function printConfig(args: CliArgs): void {
  if (args.bodyPart)  console.log(`  Mode:       body-part  → "${args.bodyPart}"`);
  else if (args.equipment) console.log(`  Mode:       equipment  → "${args.equipment}"`);
  else                console.log(`  Mode:       full library`);

  console.log(`  Page size:  ${args.pageSize}`);
  if (args.maxPages !== undefined) console.log(`  Max pages:  ${args.maxPages}`);
  console.log(`  Delay:      ${args.delayMs}ms between pages`);
  if (args.dryRun) console.log(`  Dry run:    YES — database will not be modified`);
  console.log('');
}

function printResult(result: ImportResult, dryRun: boolean): void {
  console.log('');
  console.log(DIVIDER);
  console.log(dryRun ? '  Dry Run Complete' : '  Import Complete');
  console.log(DIVIDER);
  console.log(`  ✔  Imported : ${String(result.imported).padStart(5)}`);
  console.log(`  ↺  Updated  : ${String(result.updated).padStart(5)}`);
  console.log(`  ─  Skipped  : ${String(result.skipped).padStart(5)}`);
  console.log(`  ✖  Failed   : ${String(result.failed).padStart(5)}`);

  if (result.errors.length > 0) {
    console.log('');
    console.log('  Errors:');
    for (const e of result.errors) {
      console.log(`    [${e.externalId}] ${e.name}`);
      console.log(`        ${e.error}`);
    }
  }

  console.log(DIVIDER);
  console.log('');
}

// ─── Dry-run mode ─────────────────────────────────────────────────────────────

/**
 * In dry-run mode we fetch from the API and normalise every exercise
 * but never touch the database. Counts are simulated as "imported".
 */
async function dryRun(args: CliArgs): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

  let exercises;

  if (args.bodyPart) {
    exercises = await ExerciseDbService.getExercisesByBodyPart(args.bodyPart);
  } else if (args.equipment) {
    exercises = await ExerciseDbService.getExercisesByEquipment(args.equipment);
  } else {
    const response = await ExerciseDbService.getExercises(args.pageSize, 0);
    exercises = response.exercises;
  }

  for (const raw of exercises) {
    try {
      ExerciseImportService.normalise(raw); // validate mapping only
      result.imported++;
    } catch (err) {
      result.failed++;
      result.errors.push({
        externalId: raw.id,
        name:       raw.name,
        error:      err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  printHeader();
  printConfig(args);

  // Guard: confirm required env vars are present before any work
  const missing = ['EXERCISEDB_API_KEY', 'EXERCISEDB_API_HOST', 'EXERCISEDB_BASE_URL'].filter(
    (k) => !process.env[k] || process.env[k] === `your_rapidapi_key_here`,
  );

  if (missing.length > 0) {
    console.error('  ERROR: Missing or placeholder environment variables:');
    for (const k of missing) console.error(`    ${k}`);
    console.error('');
    console.error('  Set these in backend/.env before running the import.');
    console.error('  Obtain your API key from: https://rapidapi.com');
    console.error('');
    process.exit(1);
  }

  let result: ImportResult;

  try {
    if (args.dryRun) {
      result = await dryRun(args);
    } else if (args.bodyPart) {
      console.log(`  Fetching all exercises for body part: "${args.bodyPart}"...`);
      result = await ExerciseImportService.importByBodyPart(args.bodyPart);
    } else if (args.equipment) {
      console.log(`  Fetching all exercises for equipment: "${args.equipment}"...`);
      result = await ExerciseImportService.importByEquipment(args.equipment);
    } else {
      console.log(`  Fetching full library (page size: ${args.pageSize})...`);
      result = await ExerciseImportService.importAll({
        pageSize: args.pageSize,
        maxPages: args.maxPages,
        delayMs:  args.delayMs,
      });
    }
  } catch (err) {
    console.error('');
    console.error('  FATAL: Import failed before processing could begin.');
    console.error(' ', err instanceof Error ? err.message : String(err));
    console.error('');
    await prisma.$disconnect();
    process.exit(1);
  }

  printResult(result, args.dryRun);

  await prisma.$disconnect();
  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
