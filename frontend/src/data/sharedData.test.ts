/**
 * Regression tests for shift creation reliability.
 *
 * Covers:
 *  - successful shift creation returns real DB ID
 *  - failed shift creation produces no local phantom shift
 *  - markShiftsPublished correctly marks server-confirmed IDs
 */
import { addShift, markShiftsPublished, getShifts } from '../data/sharedData';
import { shiftsAPI } from '../services/api';

jest.mock('../services/api', () => ({
  shiftsAPI: {
    create: jest.fn(),
    getAll: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    delete: jest.fn(),
    publish: jest.fn(),
    getById: jest.fn(),
  },
  staffAPI: { getAll: jest.fn().mockResolvedValue([]) },
  sitesAPI: { getAll: jest.fn().mockResolvedValue([]) },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

test('successful shift creation uses real DB ID from server', async () => {
  const localShift = { id: 'LOCAL_GHOST', staffId: 's1', date: '2026-09-11' };
  const serverShift = { id: 'SHIFT_REAL_DB_123', staffId: 's1', date: '2026-09-11' };

  (shiftsAPI.create as jest.Mock).mockResolvedValue(serverShift);

  await addShift(localShift);

  expect(shiftsAPI.create).toHaveBeenCalledWith(localShift);

  const cached = getShifts();
  const found = cached.find((s: any) => s.id === 'SHIFT_REAL_DB_123');
  expect(found).toBeDefined();
  expect(found.id).toBe('SHIFT_REAL_DB_123');

  const ghost = cached.find((s: any) => s.id === 'LOCAL_GHOST');
  expect(ghost).toBeUndefined();
});

test('failed shift creation throws and creates no local phantom', async () => {
  const localShift = { id: 'LOCAL_GHOST_2', staffId: 's1', date: '2026-09-12' };

  (shiftsAPI.create as jest.Mock).mockRejectedValue(new Error('Network error'));

  await expect(addShift(localShift)).rejects.toThrow('Network error');

  const cached = getShifts();
  const ghost = cached.find((s: any) => s.id === 'LOCAL_GHOST_2');
  expect(ghost).toBeUndefined();
});

test('markShiftsPublished marks only server-confirmed IDs', async () => {
  const shifts = [
    { id: 'shift-a', published: false },
    { id: 'shift-b', published: false },
    { id: 'shift-c', published: false },
  ];

  // Populate cache
  (shiftsAPI.create as jest.Mock)
    .mockResolvedValueOnce(shifts[0])
    .mockResolvedValueOnce(shifts[1])
    .mockResolvedValueOnce(shifts[2]);

  await addShift(shifts[0]);
  await addShift(shifts[1]);
  await addShift(shifts[2]);

  // Server confirms only shift-a and shift-c
  markShiftsPublished(['shift-a', 'shift-c']);

  const cached = getShifts();
  expect(cached.find((s: any) => s.id === 'shift-a').published).toBe(true);
  expect(cached.find((s: any) => s.id === 'shift-b').published).toBe(false);
  expect(cached.find((s: any) => s.id === 'shift-c').published).toBe(true);
});
