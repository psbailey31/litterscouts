/**
 * Test script for user profile endpoints
 * 
 * This script tests the user profile API endpoints to ensure they work correctly.
 * 
 * Usage:
 * 1. Make sure the server is running (npm run dev)
 * 2. Run: npx ts-node src/scripts/testUserEndpoints.ts
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3005/api';

// You'll need to replace this with a valid Clerk session token
const AUTH_TOKEN = 'your_clerk_session_token_here';

async function testUserEndpoints() {
  console.log('🧪 Testing User Profile Endpoints\n');

  try {
    // Test 1: Get user profile
    console.log('1️⃣ Testing GET /api/users/:id');
    try {
      const userId = 'test-user-id'; // Replace with actual user ID
      const profileResponse = await axios.get(`${API_BASE_URL}/users/${userId}`);
      console.log('✅ Get user profile successful');
      console.log('Profile:', JSON.stringify(profileResponse.data, null, 2));
    } catch (error: any) {
      console.log('❌ Get user profile failed:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 2: Update user profile
    console.log('2️⃣ Testing PATCH /api/users/:id');
    try {
      const userId = 'test-user-id'; // Replace with actual user ID
      const updateResponse = await axios.patch(
        `${API_BASE_URL}/users/${userId}`,
        {
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe123',
        },
        {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
        }
      );
      console.log('✅ Update user profile successful');
      console.log('Updated profile:', JSON.stringify(updateResponse.data, null, 2));
    } catch (error: any) {
      console.log('❌ Update user profile failed:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 3: Get user reports
    console.log('3️⃣ Testing GET /api/users/:id/reports');
    try {
      const userId = 'test-user-id'; // Replace with actual user ID
      const reportsResponse = await axios.get(`${API_BASE_URL}/users/${userId}/reports`);
      console.log('✅ Get user reports successful');
      console.log(`Found ${reportsResponse.data.length} reports`);
    } catch (error: any) {
      console.log('❌ Get user reports failed:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 4: Get user events
    console.log('4️⃣ Testing GET /api/users/:id/events');
    try {
      const userId = 'test-user-id'; // Replace with actual user ID
      const eventsResponse = await axios.get(`${API_BASE_URL}/users/${userId}/events`);
      console.log('✅ Get user events successful');
      console.log('Events:', JSON.stringify(eventsResponse.data, null, 2));
    } catch (error: any) {
      console.log('❌ Get user events failed:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 5: Update notification preferences
    console.log('5️⃣ Testing PATCH /api/users/:id/preferences');
    try {
      const userId = 'test-user-id'; // Replace with actual user ID
      const preferencesResponse = await axios.patch(
        `${API_BASE_URL}/users/${userId}/preferences`,
        {
          notificationEmail: true,
          notificationInApp: true,
          areasOfInterest: [
            {
              lat: 53.3498,
              lng: -6.2603,
              radius: 10,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
          },
        }
      );
      console.log('✅ Update notification preferences successful');
      console.log('Preferences:', JSON.stringify(preferencesResponse.data, null, 2));
    } catch (error: any) {
      console.log('❌ Update notification preferences failed:', error.response?.data || error.message);
    }

    console.log('\n');

    // Test 6: Calculate impact score
    console.log('6️⃣ Testing POST /api/users/:id/calculate-impact');
    try {
      const userId = 'test-user-id'; // Replace with actual user ID
      const impactResponse = await axios.post(`${API_BASE_URL}/users/${userId}/calculate-impact`);
      console.log('✅ Calculate impact score successful');
      console.log('Impact score:', impactResponse.data.impactScore);
    } catch (error: any) {
      console.log('❌ Calculate impact score failed:', error.response?.data || error.message);
    }

    console.log('\n✅ All tests completed!\n');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests
testUserEndpoints();
