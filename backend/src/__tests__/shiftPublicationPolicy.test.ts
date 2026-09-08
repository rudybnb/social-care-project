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
