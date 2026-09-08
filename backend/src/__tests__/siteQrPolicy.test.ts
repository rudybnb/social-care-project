import test from 'node:test';
import assert from 'node:assert/strict';
import { isQrCodeForSite } from '../services/siteQrPolicy.js';

const erithQr = 'SITE:SITE_003:1768021198394';
const thamesmeadQr = 'SITE:SITE_001:1768021198403';

test('existing Erith QR is accepted for Erith', () => {
  assert.equal(isQrCodeForSite(erithQr, 'SITE_003'), true);
});

test('existing Thamesmead QR is accepted for Thamesmead', () => {
  assert.equal(isQrCodeForSite(thamesmeadQr, 'SITE_001'), true);
});

test('Erith QR is rejected for Thamesmead', () => {
  assert.equal(isQrCodeForSite(erithQr, 'SITE_001'), false);
});

test('Thamesmead QR is rejected for Erith', () => {
  assert.equal(isQrCodeForSite(thamesmeadQr, 'SITE_003'), false);
});

test('arbitrary text containing a valid site code is rejected', () => {
  assert.equal(isQrCodeForSite('fake-SITE:SITE_003:1768021198394-text', 'SITE_003'), false);
});
