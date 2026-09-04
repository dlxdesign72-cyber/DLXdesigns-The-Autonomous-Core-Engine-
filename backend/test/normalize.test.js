import assert from 'assert';
import { normalizePhone, normalizeEmail } from '../lib/normalize.js';

function testNormalizePhone() {
  // Valid international
  assert.strictEqual(normalizePhone('+2348123456789'), '+2348123456789');
  // Local NG number
  assert.strictEqual(normalizePhone('08123456789'), '+2348123456789');
  // Fallback digits
  assert.strictEqual(normalizePhone('8123456789'), '+2348123456789');
}

function testNormalizeEmail() {
  assert.strictEqual(normalizeEmail('Test@Example.COM '), 'test@example.com');
}

(function run() {
  try {
    testNormalizePhone();
    testNormalizeEmail();
    console.log('NORMALIZE TESTS PASSED');
    process.exit(0);
  } catch (err) {
    console.error('NORMALIZE TESTS FAILED', err);
    process.exit(2);
  }
})();
