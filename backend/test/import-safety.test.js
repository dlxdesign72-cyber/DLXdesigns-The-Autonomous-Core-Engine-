(async function () {
  try {
    // Import modules - these should not throw on import
    const supModule = await import('../supabaseAdmin.js');
    const oracleModule = await import('../oracle/oracleHandler.js');
    console.log('IMPORT OK');

    // Calling getSupabaseAdmin should throw a clear message when envs missing
    try {
      await supModule.getSupabaseAdmin();
      console.error('EXPECTED ERROR: getSupabaseAdmin did not throw when envs missing');
      process.exit(2);
    } catch (err) {
      if (!/Supabase admin client unavailable/.test(err.message)) {
        console.error('UNEXPECTED ERROR from getSupabaseAdmin:', err);
        process.exit(2);
      }
    }

    // Calling callOracle should throw clear error when GEMINI_API_KEY not set
    try {
      await oracleModule.callOracle('test');
      console.error('EXPECTED ERROR: callOracle did not throw when GEMINI_API_KEY missing');
      process.exit(2);
    } catch (err) {
      if (!/Gemini API key/.test(err.message)) {
        console.error('UNEXPECTED ERROR from callOracle:', err);
        process.exit(2);
      }
    }

    console.log('IMPORT-SAFETY TESTS OK');
    process.exit(0);
  } catch (err) {
    console.error('IMPORT-SAFETY TESTS FAILED', err);
    process.exit(2);
  }
})();
