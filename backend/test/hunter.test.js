import assert from 'assert';
import { createPayloadFromItem } from '../worker/hunter_runner.js';
import { normalizePhone, normalizeEmail } from '../lib/normalize.js';

(async function test() {
  try {
    // Load test items via the test source directly
    const testFeed = await import('../worker/test_feed.json', { assert: { type: 'json' } });
    const items = testFeed.default || testFeed;
    assert.ok(Array.isArray(items) && items.length >= 1, 'test feed must contain items');

    for (const it of items) {
      const payload = createPayloadFromItem(it);
      // payload shape
      assert.strictEqual(payload.source, 'TestFeed');
      assert.strictEqual(payload.provenance, 'HUNTER_DISCOVERED');
      // normalization checks
      const p = normalizePhone(payload.contact.phone);
      assert.ok(p && p.startsWith('+'), `normalized phone must start with +, got ${p}`);
      const e = normalizeEmail(payload.contact.email);
      assert.ok(e && e.includes('@'));
    }

    console.log('HUNTER TESTS PASSED');
    process.exit(0);
  } catch (err) {
    console.error('HUNTER TESTS FAILED', err);
    process.exit(2);
  }
})();
