import assert from 'assert';
import { normalizePhone, normalizeEmail } from '../lib/normalize.js';
import { qualifyFromEvidence } from '../qualification/engine.js';

function testNormalizePhone() {
  assert.strictEqual(normalizePhone('08123456789'), '+2348123456789');
  assert.strictEqual(normalizePhone('+2348123456789'), '+2348123456789');
  assert.strictEqual(normalizePhone('2348123456789'), '+2348123456789');
}

function testNormalizeEmail() {
  assert.strictEqual(normalizeEmail('Test@Example.COM '), 'test@example.com');
}

function testQualification() {
  const evidence = { raw_signal: { intent_score: 8, product_interest: 'Senator' }, captured_at: new Date().toISOString() };
  const result = qualifyFromEvidence(evidence);
  assert.strictEqual(result.approved, true);
  assert.ok(result.score >= 8);
  assert.ok(['Gold','Silver','Bronze'].includes(result.tier));
}

(async function run() {
  try {
    testNormalizePhone();
    testNormalizeEmail();
    testQualification();
    console.log('ALL TESTS PASSED');
    process.exit(0);
  } catch (err) {
    console.error('TESTS FAILED', err);
    process.exit(2);
  }
})();
