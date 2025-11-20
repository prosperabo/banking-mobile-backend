import { buildLogger } from '../src/utils';
import type {
  UserForMigration,
  MigrationResult,
  MigrationStats,
} from './types';
import { delay } from './utils';
import { createAccountIn123 } from './services/backoffice.service';
import {
  saveBackofficeProfile,
  saveAuthState,
  hasExistingProfile,
  getUsersForMigration,
} from './services/database.service';

const logger = buildLogger('MigrateUsersScript');

/**
 * Processes a single user migration
 * @param user - User data for migration
 * @returns Migration result with success status and details
 */
async function processUser(user: UserForMigration): Promise<MigrationResult> {
  logger.info(`Processing user: ${user.email} (ID: ${user.id})`);

  try {
    // Check if user already has a backoffice profile
    const profileExists = await hasExistingProfile(user.id);
    if (profileExists) {
      logger.warn(
        `User ${user.email} already has a backoffice profile. Skipping...`
      );
      return {
        success: false,
        reason: 'already_exists',
        user: user.email,
      };
    }

    // Create account in 123 backoffice
    const accountResponse = await createAccountIn123(user);

    if (accountResponse.err) {
      throw new Error(`123 API Error: ${accountResponse.err}`);
    }

    // Normalize response: some endpoints return `ss`, others `rs`
    const backofficeData = accountResponse.ss ?? accountResponse.rs;

    if (!backofficeData) {
      throw new Error('Backoffice response missing account data');
    }

    // Save data to database
    await saveBackofficeProfile(user.id, backofficeData);
    await saveAuthState(user.id, backofficeData);

    logger.info(`User ${user.email} migrated successfully!`);

    return {
      success: true,
      user: user.email,
      externalCustomerId: backofficeData.id,
    };
  } catch (error) {
    logger.error(`Failed to process user ${user.email}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
      user: user.email,
    };
  }
}

/**
 * Main migration function
 * @param targetUserId - Optional specific user ID to migrate (defaults to user 46 for testing)
 */
async function migrateUsers(targetUserId: number = 46): Promise<void> {
  logger.info('Starting user migration to 123 backoffice...\\n');

  try {
    // Get users for migration
    const users = await getUsersForMigration(targetUserId);
    logger.info(`Found ${users.length} user(s) to process\\n`);

    // Initialize migration statistics
    const stats: MigrationStats = {
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      results: [],
    };

    // Process each user
    for (const user of users) {
      const result = await processUser(user);
      stats.results.push(result);

      // Update counters
      if (result.success) {
        stats.successCount++;
      } else if (result.reason === 'already_exists') {
        stats.skippedCount++;
      } else {
        stats.failureCount++;
      }

      // Add delay to avoid overwhelming the API
      await delay(1000);
    }

    // Log final results
    logger.info('Migration Summary:');
    logger.info(`  Successful: ${stats.successCount}`);
    logger.info(`  Skipped (already exists): ${stats.skippedCount}`);
    logger.info(`  Failed: ${stats.failureCount}`);
    logger.info('\\nMigration completed!');
  } catch (error) {
    logger.error('Fatal error during migration:', { error });
    throw error;
  }
}

// Execute migration script
if (require.main === module) {
  migrateUsers()
    .then(() => {
      logger.info('Migration script finished successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Migration script failed:', { error });
      process.exit(1);
    });
}

export { migrateUsers, processUser };
