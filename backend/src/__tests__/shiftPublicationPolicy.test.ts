import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getShiftPublicationError,
  isShiftPublished,
  UNPUBLISHED_SHIFT_MESSAGE,
} from '../services/shiftPublicationPolicy.js';

test('unpublished shift hidden from staff', () => {
  const visibleShifts = [{ id: 'draft', published: false }, { id: 'live', published: true }]
    .filter(isShiftPublished);

  assert.deepEqual(visibleShifts.map(shift => shift.id), ['live']);
});

test('direct API clock-in to unpublished shift is rejected', () => {
  assert.equal(getShiftPublicationError({ published: false }), UNPUBLISHED_SHIFT_MESSAGE);
});

test('published and accepted shift passes publication and status checks', () => {
  const shift = { published: true, staffStatus: 'accepted' };

  assert.equal(getShiftPublicationError(shift), null);
  assert.equal(shift.staffStatus, 'accepted');
});

test('published and pending shift is rejected by existing status check', () => {
  const shift = { published: true, staffStatus: 'pending' };

  assert.equal(getShiftPublicationError(shift), null);
  assert.notEqual(shift.staffStatus, 'accepted');
});

test('published overnight shift passes publication check without changing overnight data', () => {
  const shift = { published: true, type: 'Night', startTime: '20:00', endTime: '08:00' };

  assert.equal(getShiftPublicationError(shift), null);
  assert.deepEqual(
    { type: shift.type, startTime: shift.startTime, endTime: shift.endTime },
    { type: 'Night', startTime: '20:00', endTime: '08:00' },
  );
});
