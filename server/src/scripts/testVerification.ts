import prisma from '../config/database';

async function testVerification() {
  try {
    console.log('Testing verification system...\n');

    // Get a test report
    const report = await prisma.report.findFirst({
      include: {
        verifications: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      console.log('No reports found in database. Please create a report first.');
      return;
    }

    console.log('Test Report:');
    console.log(`  ID: ${report.id}`);
    console.log(`  Litter Type: ${report.litterType}`);
    console.log(`  Status: ${report.verificationStatus}`);
    console.log(`  Location: ${report.latitude}, ${report.longitude}`);
    
    // Count verifications
    const verifyCount = report.verifications.filter(v => v.verificationType === 'verify').length;
    const disputeCount = report.verifications.filter(v => v.verificationType === 'dispute').length;
    
    console.log(`\nVerification Stats:`);
    console.log(`  Verifications: ${verifyCount}`);
    console.log(`  Disputes: ${disputeCount}`);
    
    if (report.verifications.length > 0) {
      console.log(`\nVerification History:`);
      report.verifications.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.user.username} - ${v.verificationType} ${v.comment ? `("${v.comment}")` : ''}`);
      });
    }

    // Check auto-hide logic
    if (disputeCount >= 3) {
      console.log(`\n⚠️  This report should be auto-hidden (3+ disputes)`);
      console.log(`   Current status: ${report.verificationStatus}`);
      if (report.verificationStatus !== 'disputed') {
        console.log(`   ❌ ERROR: Status should be "disputed" but is "${report.verificationStatus}"`);
      } else {
        console.log(`   ✅ Status correctly set to "disputed"`);
      }
    } else if (verifyCount >= 2) {
      console.log(`\n✅ This report should be verified (2+ verifications)`);
      console.log(`   Current status: ${report.verificationStatus}`);
      if (report.verificationStatus !== 'verified') {
        console.log(`   ⚠️  Status should be "verified" but is "${report.verificationStatus}"`);
      } else {
        console.log(`   ✅ Status correctly set to "verified"`);
      }
    }

    console.log('\n✅ Verification system test complete!');
  } catch (error) {
    console.error('Error testing verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testVerification();
