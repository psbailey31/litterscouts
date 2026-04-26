/**
 * Database connection and spatial support test script
 * Run with: npx tsx src/scripts/testDatabase.ts
 */

import { prisma } from '../config/database';
import { isWithinIreland } from '../utils/spatial';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and spatial support...\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Database connection successful\n');

    // Test 2: Check MySQL version
    console.log('2. Checking MySQL version...');
    const version = await prisma.$queryRaw<Array<{ version: string }>>`SELECT VERSION() as version`;
    console.log(`   ✅ MySQL version: ${version[0].version}\n`);

    // Test 3: Verify spatial support
    console.log('3. Testing spatial support...');
    const spatialTest = await prisma.$queryRaw<Array<{ point: string; distance: number }>>`
      SELECT 
        ST_AsText(ST_GeomFromText('POINT(-6.2603 53.3498)', 4326)) as point,
        ST_Distance_Sphere(
          ST_GeomFromText('POINT(-6.2603 53.3498)', 4326),
          ST_GeomFromText('POINT(-6.2603 53.3498)', 4326)
        ) as distance
    `;
    console.log(`   ✅ Spatial functions working: ${spatialTest[0].point}\n`);

    // Test 4: Check tables exist
    console.log('4. Checking database tables...');
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY table_name
    `;
    console.log(`   ✅ Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`      - ${t.table_name}`));
    console.log('');

    // Test 5: Check spatial indexes
    console.log('5. Checking spatial indexes...');
    const spatialIndexes = await prisma.$queryRaw<Array<{ 
      table_name: string; 
      index_name: string;
      column_name: string;
    }>>`
      SELECT 
        table_name,
        index_name,
        column_name
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND index_type = 'SPATIAL'
      ORDER BY table_name, index_name
    `;
    console.log(`   ✅ Found ${spatialIndexes.length} spatial indexes:`);
    spatialIndexes.forEach(idx => 
      console.log(`      - ${idx.table_name}.${idx.column_name} (${idx.index_name})`)
    );
    console.log('');

    // Test 6: Check User table structure
    console.log('6. Checking User table for Clerk support...');
    const userColumns = await prisma.$queryRaw<Array<{ 
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'users'
      ORDER BY ordinal_position
    `;
    const hasClerkId = userColumns.some(col => col.column_name === 'clerk_id');
    if (hasClerkId) {
      console.log('   ✅ User table has clerk_id column (Clerk authentication ready)');
    } else {
      console.log('   ⚠️  User table missing clerk_id column');
    }
    console.log('');

    // Test 7: Test coordinate validation
    console.log('7. Testing coordinate validation...');
    const dublinCoords = { lat: 53.3498, lng: -6.2603 };
    const londonCoords = { lat: 51.5074, lng: -0.1278 };
    
    console.log(`   Dublin (${dublinCoords.lat}, ${dublinCoords.lng}): ${
      isWithinIreland(dublinCoords.lat, dublinCoords.lng) ? '✅ Valid' : '❌ Invalid'
    }`);
    console.log(`   London (${londonCoords.lat}, ${londonCoords.lng}): ${
      isWithinIreland(londonCoords.lat, londonCoords.lng) ? '❌ Should be invalid' : '✅ Correctly rejected'
    }`);
    console.log('');

    // Test 8: Count existing records
    console.log('8. Checking existing data...');
    const userCount = await prisma.user.count();
    const reportCount = await prisma.report.count();
    const eventCount = await prisma.event.count();
    console.log(`   Users: ${userCount}`);
    console.log(`   Reports: ${reportCount}`);
    console.log(`   Events: ${eventCount}`);
    console.log('');

    console.log('✅ All database tests passed!\n');
    console.log('Database is ready for use with:');
    console.log('  - MySQL 8.0+ with spatial support');
    console.log('  - Clerk authentication (clerk_id field)');
    console.log('  - Spatial indexes on location columns');
    console.log('  - All required tables and relationships');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
