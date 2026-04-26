/**
 * Script to fix duplicate usernames that have the pattern user_user_xxxxx
 * 
 * This script updates usernames that were created with the old logic
 * where we used `user_${clerkId}` and the clerkId already started with 'user_'
 * 
 * Usage: npx ts-node src/scripts/fixDuplicateUsernames.ts
 */

import prisma from '../config/database';

async function fixDuplicateUsernames() {
  console.log('🔍 Finding users with duplicate username pattern...\n');

  try {
    // Find all users with usernames starting with 'user_user_'
    const usersToFix = await prisma.user.findMany({
      where: {
        username: {
          startsWith: 'user_user_',
        },
      },
    });

    console.log(`Found ${usersToFix.length} users to fix\n`);

    if (usersToFix.length === 0) {
      console.log('✅ No users need fixing!');
      return;
    }

    // Fix each user
    for (const user of usersToFix) {
      const oldUsername = user.username;
      
      // Remove the duplicate 'user_' prefix
      const newUsername = oldUsername.replace(/^user_user_/, 'user');
      
      console.log(`Updating user ${user.id}:`);
      console.log(`  Old: ${oldUsername}`);
      console.log(`  New: ${newUsername}`);

      await prisma.user.update({
        where: { id: user.id },
        data: { username: newUsername },
      });

      console.log('  ✅ Updated\n');
    }

    console.log(`\n✅ Successfully fixed ${usersToFix.length} usernames!`);
  } catch (error) {
    console.error('❌ Error fixing usernames:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixDuplicateUsernames();
