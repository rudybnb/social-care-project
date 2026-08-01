import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;

const PG_BIN = 'C:\\Program Files\\PostgreSQL\\16\\bin';
const DISPOSABLE_DIR = 'C:\\Users\\rudyb\\.gemini\\antigravity-ide\\scratch\\disposable_pg16';
const PORT = 5434;

export async function startDisposablePg16() {
  console.log('🚀 Setting up disposable PostgreSQL 16 instance...');

  if (fs.existsSync(DISPOSABLE_DIR)) {
    try {
      execSync(`"${PG_BIN}\\pg_ctl.exe" stop -D "${DISPOSABLE_DIR}" -m immediate`, { stdio: 'ignore' });
    } catch (e) {}
    try {
      fs.rmSync(DISPOSABLE_DIR, { recursive: true, force: true });
    } catch (e) {}
  }

  fs.mkdirSync(DISPOSABLE_DIR, { recursive: true });

  // 1. initdb with trust authentication
  execSync(`"${PG_BIN}\\initdb.exe" -D "${DISPOSABLE_DIR}" -U postgres --auth=trust`, { stdio: 'ignore' });

  // 2. Start pg_ctl on port 5434
  const logPath = path.join(DISPOSABLE_DIR, 'pg.log');
  execSync(`"${PG_BIN}\\pg_ctl.exe" start -D "${DISPOSABLE_DIR}" -l "${logPath}" -o "-p ${PORT}"`, { stdio: 'ignore' });

  // 3. Wait for PostgreSQL 16 to be ready
  const adminUrl = `postgres://postgres@127.0.0.1:${PORT}/postgres`;
  let connected = false;
  for (let i = 0; i < 20; i++) {
    try {
      const client = new Client({ connectionString: adminUrl, connectionTimeoutMillis: 500 });
      await client.connect();
      await client.end();
      connected = true;
      break;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  if (!connected) {
    throw new Error('Failed to start disposable PostgreSQL 16 instance');
  }

  const dbName = 'social_care_auth_test';
  const adminClient = new Client({ connectionString: adminUrl });
  await adminClient.connect();
  await adminClient.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  await adminClient.query(`CREATE DATABASE "${dbName}"`);
  await adminClient.end();

  const testDbUrl = `postgres://postgres@127.0.0.1:${PORT}/${dbName}`;
  console.log(`✅ Fresh PostgreSQL 16 database created: ${dbName}`);

  return {
    dbName,
    testDbUrl,
    port: PORT,
    stop: async () => {
      console.log(`🧹 Cleaning up disposable PostgreSQL 16 database ${dbName}...`);
      try {
        const c = new Client({ connectionString: adminUrl });
        await c.connect();
        await c.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
        await c.end();
      } catch (e) {}

      try {
        execSync(`"${PG_BIN}\\pg_ctl.exe" stop -D "${DISPOSABLE_DIR}" -m immediate`, { stdio: 'ignore' });
      } catch (e) {}

      try {
        fs.rmSync(DISPOSABLE_DIR, { recursive: true, force: true });
      } catch (e) {}
      console.log('✨ Disposable PostgreSQL 16 instance cleaned up.');
    }
  };
}
