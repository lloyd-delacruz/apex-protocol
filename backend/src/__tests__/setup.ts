import 'dotenv/config';
import prisma from '../db/prisma';

// Ensure we are in test mode
process.env.NODE_ENV = 'test';

// Set a stable JWT secret for tests if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-jest';
}

// Timeout for long-running integration tests
jest.setTimeout(30_000);

afterAll(async () => {
  await prisma.$disconnect();
});
