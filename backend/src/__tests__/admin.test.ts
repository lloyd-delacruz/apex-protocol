/**
 * Admin Routes — Integration Tests
 *
 * Tests for POST /api/admin/exercises/import.
 *
 * ExerciseImportService is mocked to prevent real ExerciseDB API calls.
 * Auth and admin checks are bypassed in development (NODE_ENV !== 'production').
 *
 * Test coverage:
 *  - successful full-library import
 *  - import scoped to bodyPart
 *  - import scoped to equipment
 *  - pagination option passthrough
 *  - pageSize clamping (max 1300)
 *  - delayMs minimum (0)
 *  - bodyPart takes priority over equipment when both supplied
 *  - safe error response (no API key or internal details in response body)
 *  - error count and error array shape in happy-path response
 *  - authorization: route is reachable in dev (bypass active)
 */

import request from 'supertest';
import app from '../index';
import { ExerciseImportService } from '../services/ExerciseImportService';

jest.mock('../services/ExerciseImportService', () => ({
  ExerciseImportService: {
    importAll:         jest.fn(),
    importByBodyPart:  jest.fn(),
    importByEquipment: jest.fn(),
    normalise:         jest.fn(),
  },
}));

const AUTH = { Authorization: 'Bearer dummy-token' };

const SUCCESS_RESULT = {
  imported: 12,
  updated:  4,
  skipped:  31,
  failed:   1,
  errors: [
    { externalId: 'abc123', name: 'Bad Exercise', error: 'Missing required field' },
  ],
};

describe('POST /api/admin/exercises/import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ExerciseImportService.importAll         as jest.Mock).mockResolvedValue(SUCCESS_RESULT);
    (ExerciseImportService.importByBodyPart  as jest.Mock).mockResolvedValue(SUCCESS_RESULT);
    (ExerciseImportService.importByEquipment as jest.Mock).mockResolvedValue(SUCCESS_RESULT);
  });

  it('calls importAll and returns summary when no filters are provided', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      imported:   12,
      updated:    4,
      skipped:    31,
      failed:     1,
      errorCount: 1,
    });
    expect(ExerciseImportService.importAll).toHaveBeenCalledTimes(1);
  });

  it('response includes errors array with correct shape', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({});

    expect(res.status).toBe(200);
    const errors = res.body.data.errors;
    expect(Array.isArray(errors)).toBe(true);
    expect(errors[0]).toMatchObject({
      externalId: 'abc123',
      name:       'Bad Exercise',
      error:      'Missing required field',
    });
  });

  it('calls importByBodyPart when bodyPart is provided', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({ bodyPart: 'Chest' });

    expect(res.status).toBe(200);
    // bodyPart is lowercased before being passed to the service
    expect(ExerciseImportService.importByBodyPart).toHaveBeenCalledWith('chest');
    expect(ExerciseImportService.importAll).not.toHaveBeenCalled();
    expect(ExerciseImportService.importByEquipment).not.toHaveBeenCalled();
  });

  it('calls importByEquipment when equipment is provided (and bodyPart is absent)', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({ equipment: 'Barbell' });

    expect(res.status).toBe(200);
    expect(ExerciseImportService.importByEquipment).toHaveBeenCalledWith('barbell');
    expect(ExerciseImportService.importAll).not.toHaveBeenCalled();
  });

  it('bodyPart takes priority over equipment when both are supplied', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({ bodyPart: 'back', equipment: 'barbell' });

    expect(res.status).toBe(200);
    expect(ExerciseImportService.importByBodyPart).toHaveBeenCalledWith('back');
    expect(ExerciseImportService.importByEquipment).not.toHaveBeenCalled();
    expect(ExerciseImportService.importAll).not.toHaveBeenCalled();
  });

  it('passes valid pagination options to importAll', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({ pageSize: 50, maxPages: 3, delayMs: 250 });

    expect(res.status).toBe(200);
    expect(ExerciseImportService.importAll).toHaveBeenCalledWith({
      pageSize: 50,
      maxPages: 3,
      delayMs:  250,
    });
  });

  it('clamps pageSize to maximum of 1300', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({ pageSize: 99999 });

    expect(res.status).toBe(200);
    expect(ExerciseImportService.importAll).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 1300 }),
    );
  });

  it('clamps pageSize to minimum of 1', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({ pageSize: -50 });

    expect(res.status).toBe(200);
    expect(ExerciseImportService.importAll).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 1 }),
    );
  });

  it('clamps delayMs to minimum of 0', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({ delayMs: -999 });

    expect(res.status).toBe(200);
    expect(ExerciseImportService.importAll).toHaveBeenCalledWith(
      expect.objectContaining({ delayMs: 0 }),
    );
  });

  it('omits pagination keys when not provided', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({});

    expect(res.status).toBe(200);
    // importAll should be called with an empty options object (no undefined keys)
    const callArg = (ExerciseImportService.importAll as jest.Mock).mock.calls[0][0];
    expect(callArg).not.toHaveProperty('pageSize');
    expect(callArg).not.toHaveProperty('maxPages');
    expect(callArg).not.toHaveProperty('delayMs');
  });

  it('returns 500 with a safe generic message when import throws', async () => {
    (ExerciseImportService.importAll as jest.Mock).mockRejectedValue(
      new Error('RapidAPI key=sk-secret-api-key-abc123 returned 401'),
    );

    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({});

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    // Internal error details (including the fake API key) must NOT be in the response
    const responseText = JSON.stringify(res.body);
    expect(responseText).not.toContain('sk-secret-api-key-abc123');
    expect(res.body.error).toBe('Import failed. Check server logs for details.');
  });

  it('forwards statusCode from thrown error when present', async () => {
    const err = Object.assign(new Error('Rate limit exceeded'), { statusCode: 429 });
    (ExerciseImportService.importAll as jest.Mock).mockRejectedValue(err);

    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({});

    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
  });
});

describe('Admin route — authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ExerciseImportService.importAll as jest.Mock).mockResolvedValue({
      imported: 0, updated: 0, skipped: 0, failed: 0, errors: [],
    });
  });

  it('is accessible with an auth token in dev mode (bypass active)', async () => {
    const res = await request(app)
      .post('/api/admin/exercises/import')
      .set(AUTH)
      .send({});

    // In dev NODE_ENV, both authenticateToken and requireAdmin are bypassed
    expect(res.status).toBe(200);
  });
});
