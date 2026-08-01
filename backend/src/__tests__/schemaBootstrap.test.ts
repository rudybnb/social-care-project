import test from 'node:test';
import assert from 'node:assert/strict';
import pkg from 'pg';
const { Client } = pkg;
import { runAllMigrations } from '../run-all-migrations.js';
import fs from 'node:fs';
import path from 'node:path';

const testDbUrl = process.env.TEST_DATABASE_URL || process.env.AUTH_PHASE_1A_TEST_DATABASE_URL || process.env.DATABASE_URL;
const isLocalOrTestDb = testDbUrl && (testDbUrl.includes('localhost') || testDbUrl.includes('127.0.0.1') || testDbUrl.includes('test'));
const requireRealDb = process.env.REQUIRE_REAL_DB_TESTS === 'true';

async function getRealTestClient(): Promise<{ client: any; close: () => Promise<void> }> {
  if (!testDbUrl || !isLocalOrTestDb) {
    if (requireRealDb) {
      assert.fail('Real PostgreSQL database connection (TEST_DATABASE_URL) is required for integration proof.');
    } else {
      throw new Error('Skipping: no TEST_DATABASE_URL');
    }
  }

  const client = new Client({ connectionString: testDbUrl });
  await client.connect();

  const schemaName = `temp_bootstrap_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  await client.query(`CREATE SCHEMA "${schemaName}"`);
  await client.query(`SET search_path TO "${schemaName}"`);

  return {
    client,
    close: async () => {
      try {
        await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      } finally {
        await client.end();
      }
    }
  };
}

test('1. Real PostgreSQL: Empty database creates staff, shifts, auth_sessions and required supporting tables', async () => {
  const { client, close } = await getRealTestClient();
  try {
    await runAllMigrations({ client });

    const tableResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = current_schema()
    `);

    const createdTables = new Set(tableResult.rows.map((r: any) => r.table_name));
    const requiredTables = ['staff', 'shifts', 'auth_sessions', 'sites', 'quotes'];

    for (const reqTable of requiredTables) {
      assert.ok(createdTables.has(reqTable), `Table ${reqTable} must be created on empty database`);
    }
  } finally {
    await close();
  }
});

test('2. Real PostgreSQL: Second migration run is idempotent', async () => {
  const { client, close } = await getRealTestClient();
  try {
    await runAllMigrations({ client });
    await assert.doesNotReject(
      async () => runAllMigrations({ client }),
      'Second migration run must succeed idempotently'
    );
  } finally {
    await close();
  }
});

test('3. Real PostgreSQL: Staff count remains 0 after migration', async () => {
  const { client, close } = await getRealTestClient();
  try {
    await runAllMigrations({ client });
    const countResult = await client.query('SELECT COUNT(*)::int AS count FROM staff');
    assert.equal(countResult.rows[0].count, 0, 'No demo staff should be inserted during migration');
  } finally {
    await close();
  }
});

test('4. Startup safety: restore-staff.js is never executed in package.json start script', async () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const startScript = pkgContent.scripts?.start || '';

  assert.ok(!startScript.includes('restore-staff.js'), 'package.json start script must not invoke restore-staff.js');
  assert.ok(startScript.includes('dist/run-all-migrations.js'), 'package.json start script must invoke dist/run-all-migrations.js');
});

test('5. Real PostgreSQL: Auth_sessions foreign keys and indexes exist', async () => {
  const { client, close } = await getRealTestClient();
  try {
    await runAllMigrations({ client });

    const fkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
          AND tc.table_schema = ccu.table_schema
        WHERE tc.table_name = 'auth_sessions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'staff'
      )
    `);
    assert.ok(fkResult.rows[0].exists, 'auth_sessions must have FK referencing staff');

    const indexNames = ['idx_auth_sessions_staff_id', 'idx_auth_sessions_expires_at'];
    for (const idxName of indexNames) {
      const idxResult = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'auth_sessions' AND indexname = $1
        )
      `, [idxName]);
      assert.ok(idxResult.rows[0].exists, `Index ${idxName} must exist on auth_sessions`);
    }
  } finally {
    await close();
  }
});

test('6. Real PostgreSQL: Staff search schema and query execution are usable', async () => {
  const { client, close } = await getRealTestClient();
  try {
    await runAllMigrations({ client });

    const searchResult = await client.query(`
      SELECT id, name, role, site, status, rates
      FROM staff
      WHERE name ILIKE $1 OR username ILIKE $1
      LIMIT 50
    `, ['%alice%']);
    assert.equal(searchResult.rows.length, 0, 'Staff search query must execute cleanly against empty staff table');
  } finally {
    await close();
  }
});

test('7. Unit Test: Intentional migration SQL failure returns non-zero / throws error', async () => {
  const failingClient = {
    query: async () => {
      throw new Error('PostgreSQL 42601: syntax error at or near "/"');
    }
  };

  try {
    await runAllMigrations({ client: failingClient });
    assert.fail('Migration should have failed');
  } catch (err: any) {
    assert.match(err.message, /syntax error at or near/i);
  }
});

test('8. Unit Test: Required-table verification fails when a required table is absent', async () => {
  const incompleteClient = {
    query: async (sqlText: string) => {
      if (sqlText.includes('information_schema.tables')) {
        return { rows: [{ table_name: 'quotes' }] };
      }
      return { rows: [] };
    }
  };

  try {
    await runAllMigrations({ client: incompleteClient });
    assert.fail('Migration should have failed');
  } catch (err: any) {
    assert.match(err.message, /Required table\(s\) missing/i);
  }
});

test('9. Architecture: index.ts startup does not run another schema migration', async () => {
  const indexPath = path.resolve(process.cwd(), 'src/index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  assert.ok(!indexContent.includes('runStartupMigration'), 'index.ts must not define or call runStartupMigration');
  assert.ok(!indexContent.includes('Running comprehensive database migration'), 'index.ts must not contain duplicate migration logs');
});

test('10. Architecture: Only one migration process runs on server startup', async () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const startScript = pkgContent.scripts?.start || '';

  assert.equal(startScript, 'node dist/run-all-migrations.js && node dist/index.js');
});

test('11. Startup safety: background jobs start only after required tables are ready', async () => {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  const pkgContent = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const startScript = pkgContent.scripts?.start || '';

  assert.ok(startScript.includes('node dist/run-all-migrations.js && node dist/index.js'), 'Must execute migrations before index.js via && operator');
});

test('12. Startup safety: migration failure prevents the server from starting', async () => {
  const migrationTsPath = path.resolve(process.cwd(), 'src/run-all-migrations.ts');
  const migrationContent = fs.readFileSync(migrationTsPath, 'utf8');

  assert.ok(migrationContent.includes('process.exit(1)'), 'run-all-migrations must exit non-zero on failure to stop start chain');
});

test('13. Migration SQL safety: no SQL containing JavaScript // comments is executed', async () => {
  const migrationTsPath = path.resolve(process.cwd(), 'src/run-all-migrations.ts');
  const migrationContent = fs.readFileSync(migrationTsPath, 'utf8');

  const queryBlocks = migrationContent.match(/query\(\s*`([\s\S]*?)`/g) || [];
  for (const block of queryBlocks) {
    assert.ok(!block.includes('//'), `SQL query string block must not contain JS // comments: ${block}`);
  }
});
