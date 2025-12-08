/**
 * User Migration Script to 123 Backoffice System
 *
 * This script migrates users from the local database to the 123 backoffice system.
 * Only processes users that don't currently have backoffice profiles.
 *
 * @author Migration Team
 * @version 1.0.0
 */

import { buildLogger } from '../src/utils';
import type {
  UserForMigration,
  MigrationResult,
  MigrationStats,
} from './schemas/migration.schema';
import { delay } from './utils/helpers';
import { UserBackofficeService } from './services/backoffice.service';
import { UserService } from './services/user.service';
import { validateUserForMigration } from './utils/validation.utils';

const logger = buildLogger('MigrateUsersScript');
const backofficeService = new UserBackofficeService();
const userService = new UserService();

/**
 * Processes a single user migration
 * @param user - User data for migration
 * @returns Migration result with success status and details
 */
async function processUser(user: UserForMigration): Promise<MigrationResult> {
  logger.info(`Processing user: ${user.email} (ID: ${user.id})`);

  try {
    // Validate user
    const validation = await validateUserForMigration(user);
    if (!validation.isValid) {
      logger.warn(`Invalid user data for ${user.email}:`, {
        errors: validation.errors,
      });
      return {
        success: false,
        reason: 'validation_failed',
        user: user.email,
      };
    }

    // Check if user already has a backoffice profile
    const profileExists = await userService.hasExistingProfile(user.id);
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
    const accountResponse = await backofficeService.createAccount(user);

    if (accountResponse.err) {
      return {
        success: false,
        reason: accountResponse.err,
        user: user.email,
      };
    }

    // Normalize response: some endpoints return `ss`, others `rs`
    const backofficeData = accountResponse.ss ?? accountResponse.rs;

    if (!backofficeData) {
      throw new Error('Backoffice response missing account data');
    }

    // Save data to database
    await userService.saveBackofficeProfile(user.id, backofficeData);
    await userService.saveAuthState(user.id, backofficeData);

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
 * Main migration function - migrates users to backoffice
 */
async function migrateUsers(): Promise<void> {
  logger.info('Starting user migration to 123 backoffice for ALL users...');

  try {
    // Get users for migration (targeted or all)
    const users = await userService.getUsersForMigration(49);

    logger.info(`Found ${users.length} user(s) to process`);

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
    logger.info(`Total users processed: ${stats.results.length}`);
    logger.info(`Successful migrations: ${stats.successCount}`);
    logger.info(`Skipped (already exist): ${stats.skippedCount}`);
    logger.info(`Failed migrations: ${stats.failureCount}`);

    if (stats.failureCount > 0) {
      logger.warn('Failed users:');
      stats.results
        .filter(r => !r.success && r.reason !== 'already_exists')
        .forEach((r, index) => {
          logger.warn(`  ${index + 1}. ${r.user}`);
        });
    }

    if (stats.successCount > 0) {
      logger.info('Successfully migrated users:');
      stats.results
        .filter(r => r.success)
        .forEach(r => {
          logger.info(`  - ${r.user} (External ID: ${r.externalCustomerId})`);
        });
    }

    logger.info('Migration process completed successfully!');
  } catch (error) {
    logger.error('Fatal error during migration:', { error });
    throw error;
  }
}

// Execute migration script
if (require.main === module) {
  logger.info('Running migration for ALL users without backoffice profiles');
  logger.info('Starting migration process...');

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
