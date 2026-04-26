import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAttendees() {
  try {
    console.log('Testing attendees query...\n');
    
    // Get all events
    const events = await prisma.event.findMany({
      take: 1,
    });
    
    if (events.length === 0) {
      console.log('No events found in database');
      return;
    }
    
    const eventId = events[0].id;
    console.log(`Testing with event ID: ${eventId}`);
    console.log(`Event title: ${events[0].title}\n`);
    
    // Get registrations
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'asc',
      },
    });
    
    console.log(`Found ${registrations.length} registrations\n`);
    
    if (registrations.length > 0) {
      console.log('Sample registration:');
      const reg = registrations[0];
      console.log({
        id: reg.id,
        userId: reg.userId,
        eventId: reg.eventId,
        registeredAt: reg.registeredAt,
        attended: reg.attended,
        litterCollected: reg.litterCollected,
        contributionNote: reg.contributionNote,
        user: reg.user,
      });
    }
    
    // Test the mapping
    const mapped = registrations.map((reg) => ({
      id: reg.id,
      userId: reg.userId,
      eventId: reg.eventId,
      registeredAt: reg.registeredAt || new Date(),
      attended: reg.attended || false,
      litterCollected: reg.litterCollected ? parseFloat(reg.litterCollected.toString()) : undefined,
      contributionNote: reg.contributionNote || undefined,
      user: reg.user,
    }));
    
    console.log('\nMapped data:');
    console.log(JSON.stringify(mapped, null, 2));
    
    console.log('\n✓ Test completed successfully');
    
  } catch (error) {
    console.error('Error testing attendees:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testAttendees()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
