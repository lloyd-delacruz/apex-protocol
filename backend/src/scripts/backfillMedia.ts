/**
 * backfillMedia.ts
 * 
 * Purpose: Backfill missing mediaUrl and instructions for exercises
 *          previously imported from ExerciseDB.
 *          Resilient to RapidAPI rate limits with retry/backoff logic.
 * 
 * Usage: npx ts-node src/scripts/backfillMedia.ts [--offset <number>] [--limit <number>]
 */

import * as dotenv from 'dotenv';
import * as path   from 'path';
import prisma      from '../db/prisma';
import { ExerciseDbService }      from '../services/ExerciseDbService';
import { ExerciseImportService } from '../services/ExerciseImportService';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SLEEP_BETWEEN_PAGES = 2000;
const MAX_RETRYS = 3;
const RETRY_DELAY_BASE = 5000;

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(offset: number, pageSize: number, attempt = 1): Promise<any> {
  try {
    return await ExerciseDbService.getExercises(pageSize, offset);
  } catch (err: any) {
    const isRateLimit = err.message.includes('rate limit exceeded');
    if (isRateLimit && attempt <= MAX_RETRYS) {
      const waitTime = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
      console.warn(`\n    ⚠️  Rate limit hit at offset ${offset}. Retrying in ${waitTime/1000}s... (Attempt ${attempt}/${MAX_RETRYS})`);
      await sleep(waitTime);
      return fetchWithRetry(offset, pageSize, attempt + 1);
    }
    throw err;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const startOffset = parseInt(args[args.indexOf('--offset') + 1] || '0', 10);
  const maxToProcess = parseInt(args[args.indexOf('--limit') + 1] || '5000', 10);

  console.log('──────────────────────────────────────────');
  console.log('  Apex Protocol — Resilient Media Backfill');
  console.log(`  Offset: ${startOffset} | Limit: ${maxToProcess}`);
  console.log('──────────────────────────────────────────\n');

  if (!process.env.EXERCISEDB_API_KEY || process.env.EXERCISEDB_API_KEY === 'your_rapidapi_key_here') {
    console.error('  ERROR: EXERCISEDB_API_KEY is missing or invalid in .env\n');
    process.exit(1);
  }

  let offset = startOffset;
  const pageSize = 50; // Smaller page size is safer for rate limits
  let hasMore = true;
  let totalProcessed = 0;
  let updated = 0;
  let skipped = 0;
  let failed  = 0;

  try {
    while (hasMore && totalProcessed < maxToProcess) {
      process.stdout.write(`  [PAGE] Fetching offset ${offset}...`);
      
      const response = await fetchWithRetry(offset, pageSize);
      const exercises = response.exercises;
      
      process.stdout.write(` (Received ${exercises.length} exercises)\n`);
      
      if (exercises.length === 0) {
        hasMore = false;
        break;
      }

      // Process batch
      for (const raw of exercises) {
        try {
          const existing = await prisma.exercise.findFirst({
            where: {
              OR: [
                { externalId: raw.id, externalSource: 'exercisedb' },
                { name: { equals: raw.name.toLowerCase(), mode: 'insensitive' } }
              ]
            }
          });

          if (existing) {
            const isWger = existing.mediaUrl?.includes('wger.de');
            const hasMedia = !!existing.mediaUrl;

            if (!hasMedia || isWger) {
              const data = await ExerciseImportService.normalise(raw);
              await prisma.exercise.update({
                where: { id: existing.id },
                data: {
                  externalId:     data.externalId,
                  externalSource: data.externalSource,
                  mediaUrl:       data.mediaUrl,
                  instructions:    data.instructions,
                  lastSyncedAt:   new Date(),
                }
              });
              updated++;
            } else {
              skipped++;
            }
          } else {
            skipped++;
          }
        } catch (err: any) {
          failed++;
          console.error(`    [ERR] ${raw.name}: ${err.message}`);
        }
        totalProcessed++;
        if (totalProcessed >= maxToProcess) break;
      }

      console.log(`         Progress: ${updated} updated, ${skipped} skipped, ${failed} failed\n`);

      if (exercises.length < pageSize) {
        hasMore = false;
      } else {
        offset += pageSize;
        await sleep(SLEEP_BETWEEN_PAGES);
      }
    }
  } catch (err: any) {
    console.error('\n  FATAL ERROR:', err.message);
    console.error(`  Run again with --offset ${offset} to resume.`);
  }

  console.log('\n──────────────────────────────────────────');
  console.log(`  Summary:`);
  console.log(`  Total Fetched: ${totalProcessed}`);
  console.log(`  Updated:       ${updated}`);
  console.log(`  Skipped:       ${skipped}`);
  console.log(`  Failed:        ${failed}`);
  console.log('──────────────────────────────────────────\n');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal crash:', err);
  process.exit(1);
});
