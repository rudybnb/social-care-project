import { startDisposablePg16 } from './disposable_pg.js';
import { spawnSync } from 'child_process';

function assertLocalTestUrl(url) {
  if (!url || (!url.includes('127.0.0.1') && !url.includes('localhost'))) {
    throw new Error(`SECURITY GUARD: Test database URL must target localhost/127.0.0.1. Rejected: ${url}`);
  }
  if (url.includes('render.com') || url.includes('onrender.com') || url.includes('prod')) {
    throw new Error(`SECURITY GUARD: Remote/Production/Render URLs are strictly forbidden in test runner. Rejected: ${url}`);
  }
}

async function main() {
  let pg;
  let exitCode = 0;

  try {
    pg = await startDisposablePg16();
    assertLocalTestUrl(pg.testDbUrl);
    console.log(`🌐 Real PostgreSQL 16 instance ready.`);
    console.log(`DATABASE_NAME: ${pg.dbName}`);

    const env = {
      ...process.env,
      TEST_DATABASE_URL: pg.testDbUrl,
      AUTH_PHASE_1A_TEST_DATABASE_URL: pg.testDbUrl,
      AUTH_PHASE_1A_RUN_DB_TESTS: 'true',
      REQUIRE_REAL_DB_TESTS: 'true'
    };

    const res = spawnSync('node', ['--test', 'dist/__tests__/adminAuth.test.js', 'dist/__tests__/globalSearch.test.js', 'dist/__tests__/migration.test.js', 'dist/__tests__/schemaBootstrap.test.js', 'dist/__tests__/staffSearch.test.js'], {
      env,
      stdio: 'inherit',
      shell: true
    });

    exitCode = res.status ?? 0;
  } catch (error) {
    console.error('❌ Database test execution failed:', error.message);
    exitCode = 1;
  } finally {
    if (pg) {
      await pg.stop();
    }
    process.exit(exitCode);
  }
}

main();
