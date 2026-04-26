import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    console.log('Verifying migration...');
    
    const result = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'beach_litter_mapping' 
      AND TABLE_NAME = 'event_registrations'
      ORDER BY ORDINAL_POSITION
    ` as any[];
    
    console.log('\nColumns in event_registrations table:');
    console.table(result);
    
    const hasLitterCollected = result.some((col: any) => col.COLUMN_NAME === 'litter_collected');
    const hasContributionNote = result.some((col: any) => col.COLUMN_NAME === 'contribution_note');
    
    if (hasLitterCollected && hasContributionNote) {
      console.log('\n✓ Migration verified successfully!');
      console.log('✓ litter_collected column exists');
      console.log('✓ contribution_note column exists');
    } else {
      console.log('\n✗ Migration incomplete:');
      if (!hasLitterCollected) console.log('✗ litter_collected column missing');
      if (!hasContributionNote) console.log('✗ contribution_note column missing');
    }
    
  } catch (error) {
    console.error('Error verifying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
