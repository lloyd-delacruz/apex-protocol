import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import programRoutes from '../routes/programs';
import { ProgramGeneratorService } from '../services/ProgramGeneratorService';
import { ProgramService } from '../services/ProgramService';

// Setup basic express app wrapping the router
const app = express();
app.use(express.json());

// Mock Auth Middleware to instantly identify as 'test-user-1'
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: Response, next: NextFunction) => {
    req.userId = 'test-user-1';
    next();
  }
}));

// Mock the services the router calls
jest.mock('../services/ProgramGeneratorService');
jest.mock('../services/ProgramService');

app.use('/api/programs', programRoutes);

describe('Programs API - Generated Routes', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/programs/generate', () => {
    it('requires a valid payload (zod validation hit)', async () => {
      // Missing equipment array and valid goal
      const res = await request(app).post('/api/programs/generate').send({
        goal: 'invalid_goal',
        experienceLevel: 'beginner',
        daysPerWeek: 3
      });

      expect(res.status).toBe(400); // Because 'invalid_goal' isn't in zod enum
      expect(res.body.success).toBe(false);
      // Ensure the service wasn't called because validation failed
      expect(ProgramGeneratorService.generateProgram).not.toHaveBeenCalled();
    });

    it('succesfully validates and calls the generator service', async () => {
      const mockResult = { id: 'prog-123' };
      (ProgramGeneratorService.generateProgram as jest.Mock).mockResolvedValue(mockResult);

      const payload = {
        goal: 'hypertrophy',
        experienceLevel: 'intermediate',
        daysPerWeek: 4,
        equipment: ['dumbbells', 'barbell']
      };

      const res = await request(app).post('/api/programs/generate').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.program).toEqual(mockResult);
      expect(ProgramGeneratorService.generateProgram).toHaveBeenCalledWith({
        userId: 'test-user-1',
        ...payload
      });
    });
  });

  describe('GET /api/programs/generated/:id', () => {
    it('returns the program structure correctly', async () => {
      const mockResult = { id: 'prog-123', name: 'Mock Program' };
      (ProgramService.getProgramById as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app).get('/api/programs/generated/prog-123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.program).toEqual(mockResult);
      expect(ProgramService.getProgramById).toHaveBeenCalledWith('prog-123');
    });
  });

  describe('POST /api/programs/generated/:id/assign', () => {
    it('requires valid date if provided', async () => {
      // We pass something structurally weird (number instead of string)
      const res = await request(app).post('/api/programs/generated/prog-123/assign').send({
        startDate: 12345
      });
      // Assuming our generic schema throws 400 when date isn't string
      expect(res.status).toBe(400);
    });

    it('assigns correctly and returns payload', async () => {
      const mockResult = { assignment: { id: 'assign' }, program: { id: 'prog-123' } };
      (ProgramService.assignProgram as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app).post('/api/programs/generated/prog-123/assign').send({
        startDate: '2026-03-01'
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockResult);
      expect(ProgramService.assignProgram).toHaveBeenCalledWith('test-user-1', 'prog-123', '2026-03-01');
    });
  });
});
