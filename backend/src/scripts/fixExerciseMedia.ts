/**
 * fixExerciseMedia.ts
 *
 * Purpose: Clear duplicate/incorrect wger.de images and re-populate mediaUrl
 *          for exercises using the improved WgerService (with name similarity check).
 *
 * Run: npx ts-node --transpile-only src/scripts/fixExerciseMedia.ts
 */

import prisma from '../db/prisma';
import { WgerService } from '../services/WgerService';

// The known bad URL that was stamped on ~557 exercises incorrectly
const DUPLICATE_URL = 'https://wger.de/media/exercise-images/822/74affc0d-03b6-4f33-b5f4-a822a2615f68.png';

const CHUNK_SIZE = 5;
const DELAY_MS   = 800;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function main() {
  console.log('──────────────────────────────────────────');
  console.log('  Apex Protocol — Exercise Media Fix');
  console.log('──────────────────────────────────────────\n');

  // Step 1: Clear the duplicate bad URL
  const cleared = await prisma.exercise.updateMany({
    where: { mediaUrl: DUPLICATE_URL },
    data:  { mediaUrl: null },
  });
  console.log(`Step 1: Cleared ${cleared.count} exercises with duplicate/wrong image.\n`);

  // Step 2: Fetch all exercises that now have no mediaUrl
  const exercises = await prisma.exercise.findMany({
    where: {
      mediaUrl:  null,
      isActive:  true,
      deletedAt: null,
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  console.log(`Step 2: Found ${exercises.length} exercises without images. Fetching from wger.de...\n`);

  WgerService.clearCache();

  let updated = 0;
  let skipped = 0;
  let failed  = 0;

  for (let i = 0; i < exercises.length; i += CHUNK_SIZE) {
    const chunk = exercises.slice(i, i + CHUNK_SIZE);

    await Promise.all(chunk.map(async (ex) => {
      try {
        const url = await WgerService.getImageUrl(ex.name);
        if (url) {
          await prisma.exercise.update({
            where: { id: ex.id },
            data:  { mediaUrl: url },
          });
          updated++;
          console.log(`  [OK]   ${ex.name}`);
        } else {
          skipped++;
        }
      } catch (err: any) {
        failed++;
        console.error(`  [ERR]  ${ex.name}: ${err.message}`);
      }
    }));

    const done = Math.min(i + CHUNK_SIZE, exercises.length);
    process.stdout.write(`\r  Progress: ${done}/${exercises.length} processed...`);

    if (done < exercises.length) await sleep(DELAY_MS);
  }

  console.log('\n');
  console.log('──────────────────────────────────────────');
  console.log(`  Done!`);
  console.log(`  Updated:  ${updated}`);
  console.log(`  No image: ${skipped}`);
  console.log(`  Errors:   ${failed}`);
  console.log('──────────────────────────────────────────');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
