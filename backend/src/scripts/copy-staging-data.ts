import { validateStagingCopyGuards, getProductionStagingCopyQuery } from '../services/stagingCopyService.js';

/**
 * Standalone CLI script for manually executing pre-staging data copy.
 * NOT imported or called by index.ts, any route handler, or server startup.
 */
async function runStandaloneStagingCopy() {
  console.log('🔒 Initializing standalone pre-staging data copy guard...');

  const sourceDatabaseUrl = process.env.SOURCE_DATABASE_URL || '';
  const destinationDatabaseUrl = process.env.DESTINATION_DATABASE_URL || '';
  const isStagingDestinationConfirmed = process.env.IS_STAGING_DESTINATION === 'true';

  const confirmedDemoUuidExclusions = (process.env.CONFIRMED_DEMO_UUID_EXCLUSIONS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    validateStagingCopyGuards({
      sourceDatabaseUrl,
      destinationDatabaseUrl,
      isStagingDestinationConfirmed,
      confirmedDemoUuidExclusions,
    });

    const copyQuery = getProductionStagingCopyQuery(confirmedDemoUuidExclusions);
    console.log(`✅ Staging copy validation succeeded. Excluded demo UUID count: ${copyQuery.excludedCount}`);
    console.log(`ℹ️ Allowed fields: ${copyQuery.fields.join(', ')}`);
  } catch (error: any) {
    console.error(`❌ Staging copy aborted: ${error.message}`);
    process.exit(1);
  }
}

// Only execute when run directly via CLI
if (process.argv[1] && process.argv[1].endsWith('copy-staging-data.ts')) {
  runStandaloneStagingCopy().catch(console.error);
}
