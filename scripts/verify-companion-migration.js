#!/usr/bin/env node

/**
 * Companion Permission Migration Verification Script
 * Verifies that the new companion permission schema is correctly applied
 * and that all data was migrated successfully
 */

const { sequelize, TravelCompanion, CompanionPermission, User } = require('../models');
const logger = require('../utils/logger');

async function verifyMigration() {
  try {
    console.log('🔍 Starting companion permission migration verification...\n');

    // 1. Check CompanionPermission table structure
    console.log('1️⃣  Checking CompanionPermission schema...');
    const companionPermColumns = await sequelize.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companion_permissions' ORDER BY column_name`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const expectedColumns = [
      'canManageTrips',
      'canShareTrips',
      'companionId',
      'createdAt',
      'grantedBy',
      'id',
      'updatedAt',
    ];
    const actualColumns = companionPermColumns.map((c) => c.column_name).sort();

    if (JSON.stringify(actualColumns) === JSON.stringify(expectedColumns)) {
      console.log('   ✅ Schema is correct\n');
    } else {
      console.log('   ❌ Schema mismatch!');
      console.log(`   Expected: ${expectedColumns.join(', ')}`);
      console.log(`   Actual: ${actualColumns.join(', ')}\n`);
      return false;
    }

    // 2. Check data integrity
    console.log('2️⃣  Checking data integrity...');
    const permissionCount = await CompanionPermission.count();
    console.log(`   Found ${permissionCount} companion permissions\n`);

    if (permissionCount === 0) {
      console.log('   ⚠️  No companion permissions found (expected for new database)\n');
    }

    // 3. Verify all permissions have required fields
    console.log('3️⃣  Verifying permission records...');
    const permissions = await CompanionPermission.findAll({
      include: [
        {
          model: TravelCompanion,
          as: 'companion',
          attributes: ['id', 'email', 'createdBy'],
        },
      ],
    });

    let hasErrors = false;
    for (const perm of permissions) {
      if (!perm.companionId) {
        console.log(`   ❌ Permission ${perm.id} missing companionId`);
        hasErrors = true;
      }
      if (!perm.grantedBy) {
        console.log(`   ❌ Permission ${perm.id} missing grantedBy`);
        hasErrors = true;
      }
      if (perm.canShareTrips === null || perm.canShareTrips === undefined) {
        console.log(`   ❌ Permission ${perm.id} has invalid canShareTrips: ${perm.canShareTrips}`);
        hasErrors = true;
      }
      if (perm.canManageTrips === null || perm.canManageTrips === undefined) {
        console.log(
          `   ❌ Permission ${perm.id} has invalid canManageTrips: ${perm.canManageTrips}`
        );
        hasErrors = true;
      }
    }

    if (!hasErrors && permissions.length > 0) {
      console.log(`   ✅ All ${permissions.length} permission records are valid\n`);
    } else if (permissions.length === 0) {
      console.log('   ✅ No permissions to verify\n');
    }

    // 4. Check TravelCompanion associations
    console.log('4️⃣  Checking TravelCompanion associations...');
    const companionCount = await TravelCompanion.count();
    console.log(`   Found ${companionCount} travel companions`);

    const companionsWithPermissions = await TravelCompanion.count({
      include: [
        {
          model: CompanionPermission,
          as: 'permissions',
          required: true,
        },
      ],
    });

    console.log(`   ${companionsWithPermissions} companions have associated permissions\n`);

    // 5. Verify unique constraint
    console.log('5️⃣  Checking unique constraint (companionId, grantedBy)...');
    const duplicates = await sequelize.query(
      `SELECT "companionId", "grantedBy", COUNT(*) as count
       FROM companion_permissions
       GROUP BY "companionId", "grantedBy"
       HAVING COUNT(*) > 1`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (duplicates.length === 0) {
      console.log('   ✅ No duplicate (companionId, grantedBy) pairs\n');
    } else {
      console.log('   ❌ Found duplicate permission pairs:');
      duplicates.forEach((dup) => {
        console.log(
          `      companionId: ${dup.companionId}, grantedBy: ${dup.grantedBy}, count: ${dup.count}`
        );
      });
      console.log();
      hasErrors = true;
    }

    // 6. Verify foreign key references
    console.log('6️⃣  Checking foreign key integrity...');
    const orphanedPermissions = await sequelize.query(
      `SELECT cp.id FROM companion_permissions cp
       LEFT JOIN travel_companions tc ON cp."companionId" = tc.id
       WHERE tc.id IS NULL`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (orphanedPermissions.length === 0) {
      console.log('   ✅ All companion permissions reference valid companions\n');
    } else {
      console.log(`   ❌ Found ${orphanedPermissions.length} orphaned permission records\n`);
      hasErrors = true;
    }

    const orphanedGrants = await sequelize.query(
      `SELECT cp.id FROM companion_permissions cp
       LEFT JOIN users u ON cp."grantedBy" = u.id
       WHERE u.id IS NULL`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (orphanedGrants.length === 0) {
      console.log('   ✅ All companion permissions reference valid granting users\n');
    } else {
      console.log(`   ❌ Found ${orphanedGrants.length} permissions with invalid grantedBy\n`);
      hasErrors = true;
    }

    // 7. Summary
    console.log('━'.repeat(60));
    if (!hasErrors) {
      console.log('✅ Migration verification PASSED\n');
      return true;
    }
    console.log('❌ Migration verification FAILED - please review errors above\n');
    return false;
  } catch (error) {
    logger.error('Error during migration verification:', error);
    console.error('\n❌ Verification failed with error:', error.message);
    return false;
  } finally {
    await sequelize.close();
  }
}

// Run verification
verifyMigration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
