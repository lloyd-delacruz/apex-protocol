/**
 * Apex Protocol — Database Seed Script
 *
 * Seeds:
 *  1. Roles (admin, user, coach)
 *  2. Exercise library (23 exercises from DATABASE_SCHEMA.md)
 *  3. Apex Protocol 12-Week Base Program
 *     - 3 months × 4 weeks = 12 weeks
 *     - 7 days per week (4 training + 2 cardio/conditioning + 1 rest)
 *     - All exercise prescriptions
 *  4. Development user account
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { EXERCISE_LIBRARY, EXERCISE_SUBSTITUTIONS } from './exerciseLibrary';

const prisma = new PrismaClient();

// ─── Weekly workout template ──────────────────────────────────────────────────
// Each week follows the same 7-day structure.
// sort_order 1–7 maps to Mon–Sun.

interface Prescription {
  exerciseName: string;
  targetRepRange: string | null;
  incrementValue: number;
  incrementUnit: string;
  sortOrder: number;
}

interface WorkoutDayTemplate {
  dayCode: string;
  phase: string;
  workoutType: string;
  sortOrder: number;
  notes: string | null;
  prescriptions: Prescription[];
}

const WEEKLY_TEMPLATE: WorkoutDayTemplate[] = [
  {
    dayCode: 'Mon',
    phase: 'Strength',
    workoutType: 'Upper Strength',
    sortOrder: 1,
    notes: 'Focus: maximal tension, controlled eccentrics',
    prescriptions: [
      { exerciseName: 'Bench Press', targetRepRange: '4-6', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 1 },
      { exerciseName: 'Weighted Pull-ups', targetRepRange: '4-6', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 2 },
      { exerciseName: 'Overhead Press', targetRepRange: '6-8', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 3 },
      { exerciseName: 'Barbell Row', targetRepRange: '4-6', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 4 },
    ],
  },
  {
    dayCode: 'Tue',
    phase: 'Strength',
    workoutType: 'Lower Strength',
    sortOrder: 2,
    notes: 'Focus: maximal load, full depth',
    prescriptions: [
      { exerciseName: 'Back Squat', targetRepRange: '4-6', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 1 },
      { exerciseName: 'Deadlift', targetRepRange: '3-5', incrementValue: 5, incrementUnit: 'kg', sortOrder: 2 },
      { exerciseName: 'Leg Press', targetRepRange: '8-12', incrementValue: 5, incrementUnit: 'kg', sortOrder: 3 },
      { exerciseName: 'Hamstring Curl', targetRepRange: '8-12', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 4 },
    ],
  },
  {
    dayCode: 'Wed',
    phase: 'Cardio',
    workoutType: 'Active Recovery',
    sortOrder: 3,
    notes: '30–45 min low intensity. Heart rate 120–140 bpm.',
    prescriptions: [
      { exerciseName: 'Zone 2 Cardio', targetRepRange: null, incrementValue: 0, incrementUnit: 'kg', sortOrder: 1 },
    ],
  },
  {
    dayCode: 'Thu',
    phase: 'Hypertrophy',
    workoutType: 'Upper Hypertrophy',
    sortOrder: 4,
    notes: 'Focus: muscle contraction and pump, 2-3s eccentric',
    prescriptions: [
      { exerciseName: 'Incline DB Press', targetRepRange: '8-12', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 1 },
      { exerciseName: 'Lat Pulldown', targetRepRange: '8-12', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 2 },
      { exerciseName: 'DB Shoulder Press', targetRepRange: '10-15', incrementValue: 2, incrementUnit: 'kg', sortOrder: 3 },
      { exerciseName: 'Cable Row', targetRepRange: '10-15', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 4 },
      { exerciseName: 'Fly Machine', targetRepRange: '12-15', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 5 },
      { exerciseName: 'Lateral Raise', targetRepRange: '15-20', incrementValue: 1, incrementUnit: 'kg', sortOrder: 6 },
    ],
  },
  {
    dayCode: 'Fri',
    phase: 'Hypertrophy',
    workoutType: 'Lower Hypertrophy',
    sortOrder: 5,
    notes: 'Focus: quad and glute development, full ROM',
    prescriptions: [
      { exerciseName: 'Bulgarian Split Squat', targetRepRange: '8-12', incrementValue: 2, incrementUnit: 'kg', sortOrder: 1 },
      { exerciseName: 'Hip Thrust', targetRepRange: '10-15', incrementValue: 5, incrementUnit: 'kg', sortOrder: 2 },
      { exerciseName: 'Leg Extension', targetRepRange: '12-15', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 3 },
      { exerciseName: 'Seated Ham Curl', targetRepRange: '10-15', incrementValue: 2.5, incrementUnit: 'kg', sortOrder: 4 },
      { exerciseName: 'Calf Raise', targetRepRange: '15-20', incrementValue: 5, incrementUnit: 'kg', sortOrder: 5 },
    ],
  },
  {
    dayCode: 'Sat',
    phase: 'Cardio',
    workoutType: 'Conditioning',
    sortOrder: 6,
    notes: '20 min HIIT or 40 min Zone 2. Choose based on fatigue.',
    prescriptions: [
      { exerciseName: 'HIIT', targetRepRange: null, incrementValue: 0, incrementUnit: 'kg', sortOrder: 1 },
    ],
  },
  {
    dayCode: 'Sun',
    phase: 'Rest',
    workoutType: 'Rest Day',
    sortOrder: 7,
    notes: 'Full rest or light walk + mobility work.',
    prescriptions: [
      { exerciseName: 'Walk + Stretch', targetRepRange: null, incrementValue: 0, incrementUnit: 'kg', sortOrder: 1 },
    ],
  },
];

// ─── Month definitions ────────────────────────────────────────────────────────

const MONTHS = [
  { monthNumber: 1, name: 'Month 1 — Foundation', description: 'Build movement patterns and baseline strength.' },
  { monthNumber: 2, name: 'Month 2 — Development', description: 'Progressive overload and volume accumulation.' },
  { monthNumber: 3, name: 'Month 3 — Intensification', description: 'Peak intensity, maximum effort sets.' },
];

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Apex Protocol database...');

  // 1. Roles
  console.log('  → Seeding roles...');
  await prisma.role.createMany({
    data: [
      { name: 'admin' },
      { name: 'user' },
      { name: 'coach' },
    ],
    skipDuplicates: true,
  });

  const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

  // 2. Exercises — upsert full library so existing records get enriched
  console.log(`  → Seeding ${EXERCISE_LIBRARY.length} exercises...`);
  for (const ex of EXERCISE_LIBRARY) {
    const data = {
      category: ex.category,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment ?? null,
      bodyPart: ex.bodyPart ?? null,
      primaryMuscle: ex.primaryMuscle ?? null,
      secondaryMuscles: ex.secondaryMuscles ?? [],
      movementPattern: ex.movementPattern ?? null,
      exerciseType: ex.exerciseType ?? null,
      goalTags: ex.goalTags ?? [],
      difficulty: ex.difficulty ?? null,
      instructions: ex.instructions ?? null,
      isCompound: ex.isCompound ?? false,
      isUnilateral: ex.isUnilateral ?? false,
    };
    await prisma.exercise.upsert({
      where: { name: ex.name },
      create: { name: ex.name, ...data },
      update: data,
    });
  }

  // Build exercise name → id map
  const allExercises = await prisma.exercise.findMany({ select: { id: true, name: true } });
  const exerciseMap = new Map(allExercises.map((e) => [e.name, e.id]));

  // 2b. Substitutions
  console.log('  → Seeding exercise substitutions...');
  for (const sub of EXERCISE_SUBSTITUTIONS) {
    const originalId = exerciseMap.get(sub.original);
    if (!originalId) continue;
    for (let i = 0; i < sub.substitutes.length; i++) {
      const subId = exerciseMap.get(sub.substitutes[i]);
      if (!subId) continue;
      await prisma.exerciseSubstitution.upsert({
        where: { exerciseId_substituteExerciseId: { exerciseId: originalId, substituteExerciseId: subId } },
        create: { exerciseId: originalId, substituteExerciseId: subId, priorityRank: i + 1, notes: sub.notes ?? null },
        update: { priorityRank: i + 1 },
      });
    }
  }

  // 3. Program
  console.log('  → Seeding program...');
  const program = await prisma.program.upsert({
    where: { slug: 'apex-protocol-12-week-base' },
    update: {},
    create: {
      name: 'Apex Protocol 12-Week Base Program',
      slug: 'apex-protocol-12-week-base',
      description:
        'A structured 12-week strength and hypertrophy program. 4 training days per week with progressive overload built in. Suitable for intermediate lifters.',
      totalWeeks: 12,
      isActive: true,
      isCustom: false,
      sourceType: 'system',
      goalType: 'strength,hypertrophy',
      experienceLevel: 'intermediate',
      daysPerWeek: 4,
    },
  });

  // Delete existing structure so re-seeding is idempotent
  await prisma.programMonth.deleteMany({ where: { programId: program.id } });

  // 4. Months → Weeks → Days → Prescriptions
  let absoluteWeek = 1;

  for (const monthDef of MONTHS) {
    console.log(`  → Seeding ${monthDef.name}...`);

    const month = await prisma.programMonth.create({
      data: {
        programId: program.id,
        monthNumber: monthDef.monthNumber,
        name: monthDef.name,
        description: monthDef.description,
      },
    });

    for (let weekInMonth = 1; weekInMonth <= 4; weekInMonth++) {
      const week = await prisma.programWeek.create({
        data: {
          programMonthId: month.id,
          weekNumber: weekInMonth,
          absoluteWeekNumber: absoluteWeek,
        },
      });

      // Create 7 workout days using the weekly template
      for (const dayTemplate of WEEKLY_TEMPLATE) {
        const workoutDay = await prisma.workoutDay.create({
          data: {
            programWeekId: week.id,
            dayCode: dayTemplate.dayCode,
            phase: dayTemplate.phase,
            workoutType: dayTemplate.workoutType,
            sortOrder: dayTemplate.sortOrder,
            notes: dayTemplate.notes,
          },
        });

        // Create exercise prescriptions for this day
        for (const pres of dayTemplate.prescriptions) {
          const exerciseId = exerciseMap.get(pres.exerciseName);
          if (!exerciseId) {
            console.warn(`    ⚠ Exercise not found: ${pres.exerciseName}`);
            continue;
          }

          await prisma.exercisePrescription.create({
            data: {
              workoutDayId: workoutDay.id,
              exerciseId,
              targetRepRange: pres.targetRepRange,
              incrementValue: pres.incrementValue,
              incrementUnit: pres.incrementUnit,
              sortOrder: pres.sortOrder,
            },
          });
        }
      }

      absoluteWeek++;
    }
  }

  // 5. Dev user
  console.log('  → Seeding development user...');
  const devPasswordHash = await bcrypt.hash('Password123!', 12);

  const devUser = await prisma.user.upsert({
    where: { email: 'dev@apexprotocol.io' },
    update: {},
    create: {
      email: 'dev@apexprotocol.io',
      passwordHash: devPasswordHash,
      firstName: 'Dev',
      lastName: 'User',
      roleId: userRole!.id,
    },
  });

  // Assign the base program to the dev user
  const existing = await prisma.userProgramAssignment.findFirst({
    where: { userId: devUser.id, programId: program.id },
  });

  if (!existing) {
    await prisma.userProgramAssignment.create({
      data: {
        userId: devUser.id,
        programId: program.id,
        startDate: new Date(),
        isActive: true,
      },
    });
  }

  const totalExercises = await prisma.exercise.count();
  const totalSubs = await prisma.exerciseSubstitution.count();
  console.log('✅ Seed complete.');
  console.log('');
  console.log('  Dev account:  dev@apexprotocol.io / Password123!');
  console.log(`  Program:      ${program.name}`);
  console.log(`  Exercises:    ${totalExercises}`);
  console.log(`  Substitutions: ${totalSubs}`);
  console.log(`  Weeks:        12 (3 months × 4 weeks)`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
