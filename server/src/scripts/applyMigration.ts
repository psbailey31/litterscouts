import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Applying migration: add_attendee_contributions');
    
    // Check if columns exist
    const result = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'beach_litter_mapping' 
      AND TABLE_NAME = 'event_registrations' 
      AND COLUMN_NAME IN ('litter_collected', 'contribution_note')
    ` as any[];
    
    console.log('Existing columns:', result);
    
    if (result.length === 0) {
      console.log('Adding columns...');
      await prisma.$executeRaw`
        ALTER TABLE event_registrations 
        ADD COLUMN litter_collected DECIMAL(10, 2) NULL,
        ADD COLUMN contribution_note TEXT NULL
      `;
      console.log('✓ Columns added successfully');
    } else if (result.length === 1) {
      const existingColumn = result[0].COLUMN_NAME;
      const missingColumn = existingColumn === 'litter_collected' ? 'contribution_note' : 'litter_collected';
      console.log(`Adding missing column: ${missingColumn}`);
      await prisma.$executeRaw`
        ALTER TABLE event_registrations 
        ADD COLUMN ${missingColumn} ${missingColumn === 'litter_collected' ? 'DECIMAL(10, 2)' : 'TEXT'} NULL
      `;
      console.log('✓ Column added successfully');
    } else {
      console.log('✓ Columns already exist');
    }
    
  } catch (error) {
    console.error('Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
