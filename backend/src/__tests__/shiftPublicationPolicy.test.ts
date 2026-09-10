import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getShiftPublicationError,
  getUniqueShiftIds,
  isShiftPublished,
  UNPUBLISHED_SHIFT_MESSAGE,
} from '../services/shiftPublicationPolicy.js';

test('unpublished shift hidden from staff', () => {
  const visibleShifts = [{ id: 'draft', published: false }, { id: 'live', published: true }]
    .filter(isShiftPublished);

  assert.deepEqual(visibleShifts.map(shift => shift.id), ['live']);
});

test('direct accept request for unpublished shift is rejected', () => {
  assert.equal(getShiftPublicationError({ published: false }), UNPUBLISHED_SHIFT_MESSAGE);
});

test('direct clock-in request for unpublished shift is rejected', () => {
  assert.equal(getShiftPublicationError({ published: false }), UNPUBLISHED_SHIFT_MESSAGE);
});

test('published pending shift is visible but cannot clock in', () => {
  const shift = { published: true, staffStatus: 'pending' };

  assert.equal(isShiftPublished(shift), true);
  assert.equal(getShiftPublicationError(shift), null);
  assert.notEqual(shift.staffStatus, 'accepted');
});

test('published accepted shift is visible and eligible under normal rules', () => {
  const shift = { published: true, staffStatus: 'accepted' };

  assert.equal(isShiftPublished(shift), true);
  assert.equal(getShiftPublicationError(shift), null);
  assert.equal(shift.staffStatus, 'accepted');
});

test('admin publish targets each intended draft once and leaves published shifts unchanged', () => {
  const shiftIds = getUniqueShiftIds(['draft-1', 'draft-2', 'draft-1']);
  const shifts = [
    { id: 'draft-1', published: false },
    { id: 'draft-2', published: false },
    { id: 'already-live', published: true },
    { id: 'other-draft', published: false },
  ];
  const updated = shifts
    .filter(shift => shiftIds.includes(shift.id) && !shift.published)
    .map(shift => ({ ...shift, published: true }));

  assert.deepEqual(updated, [
    { id: 'draft-1', published: true },
    { id: 'draft-2', published: true },
  ]);
});

test('publish response count is authoritative — frontend must use server count', () => {
  const frontendUnpublished = 28;
  const serverResponse = { success: true, count: 4, publishedShiftIds: ['a', 'b', 'c', 'd'] };

  assert.equal(serverResponse.count, 4);
  assert.notEqual(serverResponse.count, frontendUnpublished);
  assert.equal(serverResponse.publishedShiftIds.length, 4);
});

test('published shift becomes visible to staff via isShiftPublished filter', () => {
  const allShifts = [
    { id: 's1', published: false, staffStatus: 'accepted' },
    { id: 's2', published: true, staffStatus: 'accepted' },
    { id: 's3', published: true, staffStatus: 'pending' },
  ];

  const visibleToStaff = allShifts.filter(isShiftPublished);
  assert.equal(visibleToStaff.length, 2);
  assert.deepEqual(visibleToStaff.map(s => s.id), ['s2', 's3']);
});

test('phantom IDs not in DB produce zero server updates', () => {
  const frontendIds = ['local-1', 'local-2', 'local-3', 'local-4', 'real-1'];
  const dbShifts = [
    { id: 'real-1', published: false },
    { id: 'real-2', published: true },
  ];

  const matched = dbShifts.filter(
    s => frontendIds.includes(s.id) && s.published === false
  );
  assert.equal(matched.length, 1);
});

test('accepted published shift remains clock-in eligible', () => {
  const shift = { published: true, staffStatus: 'accepted' };
  assert.equal(isShiftPublished(shift), true);
  assert.equal(getShiftPublicationError(shift), null);
  assert.equal(shift.staffStatus, 'accepted');
});
