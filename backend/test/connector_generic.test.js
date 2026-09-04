import assert from 'assert';
import { runGenericConnector, createPayloadFromEntry } from '../worker/connector_generic.js';
import testFeed from '../worker/test_feed.json' assert { type: 'json' };

(async function test() {
  try {
    // Ensure connector gracefully warns when disabled
    process.env.CONNECTOR_ENABLED = '0';
    await runGenericConnector({ process: false, feedUrl: null });

    // Simulate enabled but no URL
    process.env.CONNECTOR_ENABLED = '1';
    await runGenericConnector({ process: false, feedUrl: null });

    // Use test feed directly by passing feedUrl as data: URL
    const feedJson = JSON.stringify(testFeed);
    const dataUrl = 'data:application/json,' + encodeURIComponent(feedJson);
    // run without processing
    await runGenericConnector({ process: false, feedUrl: dataUrl, sourceName: 'TestGeneric' });

    // validate payload creation
    const payload = createPayloadFromEntry(testFeed[0], 'TestGeneric');
    assert.strictEqual(payload.source, 'TestGeneric');
    assert.strictEqual(payload.provenance, 'HUNTER_DISCOVERED');

    console.log('CONNECTOR GENERIC TESTS PASSED');
    process.exit(0);
  } catch (err) {
    console.error('CONNECTOR GENERIC TESTS FAILED', err);
    process.exit(2);
  }
})();
