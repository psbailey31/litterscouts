/**
 * Test script for hotspot API endpoints
 * Tests GET /api/analytics/hotspots and POST /api/analytics/hotspots/calculate
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005/api';

async function testHotspotEndpoints() {
  console.log('=== Testing Hotspot API Endpoints ===\n');

  try {
    // Test 1: Manually trigger hotspot calculation
    console.log('Test 1: POST /api/analytics/hotspots/calculate');
    console.log('----------------------------------------');
    try {
      const calculateResponse = await axios.post(`${API_BASE_URL}/analytics/hotspots/calculate`);
      console.log('✓ Status:', calculateResponse.status);
      console.log('✓ Response:', JSON.stringify(calculateResponse.data, null, 2));
    } catch (error: any) {
      if (error.response) {
        console.log('✓ Status:', error.response.status);
        console.log('✓ Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('❌ Error:', error.message);
      }
    }
    console.log();

    // Test 2: Get all hotspots
    console.log('Test 2: GET /api/analytics/hotspots');
    console.log('----------------------------------------');
    try {
      const hotspotsResponse = await axios.get(`${API_BASE_URL}/analytics/hotspots`);
      console.log('✓ Status:', hotspotsResponse.status);
      console.log('✓ Number of hotspots:', hotspotsResponse.data.data.length);
      
      if (hotspotsResponse.data.data.length > 0) {
        console.log('✓ Sample hotspot:', JSON.stringify(hotspotsResponse.data.data[0], null, 2));
      } else {
        console.log('✓ No hotspots found (expected if < 5 reports within 500m in last 30 days)');
      }
    } catch (error: any) {
      if (error.response) {
        console.log('❌ Status:', error.response.status);
        console.log('❌ Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('❌ Error:', error.message);
      }
    }
    console.log();

    // Test 3: Get hotspot details (if any exist)
    console.log('Test 3: GET /api/analytics/hotspots/:id');
    console.log('----------------------------------------');
    try {
      const hotspotsResponse = await axios.get(`${API_BASE_URL}/analytics/hotspots`);
      
      if (hotspotsResponse.data.data.length > 0) {
        const firstHotspotId = hotspotsResponse.data.data[0].id;
        const detailsResponse = await axios.get(`${API_BASE_URL}/analytics/hotspots/${firstHotspotId}`);
        console.log('✓ Status:', detailsResponse.status);
        console.log('✓ Hotspot details:', JSON.stringify(detailsResponse.data.data.hotspot, null, 2));
        console.log('✓ Number of reports in hotspot:', detailsResponse.data.data.reports.length);
      } else {
        console.log('⊘ Skipping test - no hotspots available');
      }
    } catch (error: any) {
      if (error.response) {
        console.log('❌ Status:', error.response.status);
        console.log('❌ Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('❌ Error:', error.message);
      }
    }
    console.log();

    // Test 4: Test error handling - invalid hotspot ID
    console.log('Test 4: GET /api/analytics/hotspots/:id (invalid ID)');
    console.log('----------------------------------------');
    try {
      await axios.get(`${API_BASE_URL}/analytics/hotspots/invalid-id-12345`);
      console.log('❌ Should have returned 404 error');
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.log('✓ Status:', error.response.status);
        console.log('✓ Correctly returned 404 for invalid ID');
        console.log('✓ Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('❌ Unexpected error:', error.message);
      }
    }
    console.log();

    console.log('=== All Endpoint Tests Completed ===');
  } catch (error: any) {
    console.error('❌ Fatal error during testing:', error.message);
  }
}

// Run tests
console.log('Note: Make sure the server is running on port 3005 before running this test.\n');
testHotspotEndpoints();
