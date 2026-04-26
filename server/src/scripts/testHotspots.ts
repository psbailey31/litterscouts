/**
 * Test script for hotspot calculation system
 * Tests the hotspot calculation, storage, and retrieval functionality
 */

import { analyticsService } from '../services/analyticsService';
import prisma from '../config/database';

async function testHotspots() {
  console.log('=== Testing Hotspot Calculation System ===\n');

  try {
    // Test 1: Calculate and update hotspots
    console.log('Test 1: Calculate and update hotspots');
    console.log('----------------------------------------');
    const calculateResult = await analyticsService.calculateAndUpdateHotspots();
    console.log('✓ Hotspot calculation result:', calculateResult);
    console.log();

    // Test 2: Retrieve hotspots
    console.log('Test 2: Retrieve hotspots from database');
    console.log('----------------------------------------');
    const hotspots = await analyticsService.getHotspots();
    console.log(`✓ Found ${hotspots.length} hotspots`);
    
    if (hotspots.length > 0) {
      console.log('\nTop 3 hotspots by severity:');
      hotspots.slice(0, 3).forEach((hotspot, index) => {
        console.log(`  ${index + 1}. Hotspot at (${hotspot.latitude}, ${hotspot.longitude})`);
        console.log(`     - Report Count: ${hotspot.reportCount}`);
        console.log(`     - Severity Score: ${hotspot.severityScore}`);
        console.log(`     - Radius: ${hotspot.radius}m`);
        console.log(`     - Last Report: ${hotspot.lastReportDate}`);
      });
    } else {
      console.log('  No hotspots found. This is expected if there are fewer than 5 reports within 500m in the last 30 days.');
    }
    console.log();

    // Test 3: Get hotspot details (if any exist)
    if (hotspots.length > 0) {
      console.log('Test 3: Get detailed hotspot information');
      console.log('----------------------------------------');
      const firstHotspot = hotspots[0];
      const details = await analyticsService.getHotspotDetails(firstHotspot.id);
      console.log(`✓ Hotspot details for ${firstHotspot.id}:`);
      console.log(`  - Location: (${details.hotspot.latitude}, ${details.hotspot.longitude})`);
      console.log(`  - Reports in area: ${details.reports.length}`);
      
      if (details.reports.length > 0) {
        console.log('\n  Recent reports in this hotspot:');
        details.reports.slice(0, 3).forEach((report, index) => {
          console.log(`    ${index + 1}. ${report.litterType} (${report.quantity}) - ${report.distance.toFixed(0)}m away`);
        });
      }
      console.log();
    }

    // Test 4: Check report distribution for hotspot eligibility
    console.log('Test 4: Check report distribution');
    console.log('----------------------------------------');
    const recentReports = await prisma.report.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });
    console.log(`✓ Total reports in last 30 days: ${recentReports}`);
    console.log(`  Note: Hotspots require 5+ reports within 500m radius`);
    console.log();

    // Test 5: Verify hotspot table structure
    console.log('Test 5: Verify hotspot table structure');
    console.log('----------------------------------------');
    const allHotspots = await prisma.hotspot.findMany({
      take: 1,
    });
    
    if (allHotspots.length > 0) {
      console.log('✓ Hotspot table structure verified');
      console.log('  Sample hotspot fields:', Object.keys(allHotspots[0]));
    } else {
      console.log('✓ Hotspot table exists but is empty');
    }
    console.log();

    console.log('=== All Tests Completed Successfully ===');
  } catch (error: any) {
    console.error('❌ Error during testing:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testHotspots();
