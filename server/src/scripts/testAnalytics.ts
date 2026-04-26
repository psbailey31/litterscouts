import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3005/api';

async function testAnalyticsEndpoints() {
  console.log('🧪 Testing Analytics Endpoints\n');

  try {
    // Test 1: Get summary statistics
    console.log('1️⃣ Testing GET /api/analytics/summary');
    const summaryResponse = await axios.get(`${API_BASE_URL}/analytics/summary`);
    console.log('✅ Summary response:', JSON.stringify(summaryResponse.data, null, 2));
    console.log('');

    // Test 2: Get summary with date range
    console.log('2️⃣ Testing GET /api/analytics/summary with date range');
    const startDate = new Date('2024-01-01').toISOString();
    const endDate = new Date().toISOString();
    const summaryWithDateResponse = await axios.get(
      `${API_BASE_URL}/analytics/summary?startDate=${startDate}&endDate=${endDate}`
    );
    console.log('✅ Summary with date range:', JSON.stringify(summaryWithDateResponse.data, null, 2));
    console.log('');

    // Test 3: Get time series trends
    console.log('3️⃣ Testing GET /api/analytics/trends');
    const trendsResponse = await axios.get(
      `${API_BASE_URL}/analytics/trends?startDate=${startDate}&endDate=${endDate}&interval=day`
    );
    console.log('✅ Trends response (first 5 entries):', 
      JSON.stringify(trendsResponse.data.data.slice(0, 5), null, 2)
    );
    console.log(`   Total data points: ${trendsResponse.data.data.length}`);
    console.log('');

    // Test 4: Get comparison metrics
    console.log('4️⃣ Testing GET /api/analytics/comparison');
    const currentStart = new Date('2024-11-01').toISOString();
    const currentEnd = new Date('2024-11-30').toISOString();
    const previousStart = new Date('2024-10-01').toISOString();
    const previousEnd = new Date('2024-10-31').toISOString();
    
    const comparisonResponse = await axios.get(
      `${API_BASE_URL}/analytics/comparison?currentStart=${currentStart}&currentEnd=${currentEnd}&previousStart=${previousStart}&previousEnd=${previousEnd}`
    );
    console.log('✅ Comparison metrics:', JSON.stringify(comparisonResponse.data, null, 2));
    console.log('');

    // Test 5: Get aggregated data
    console.log('5️⃣ Testing GET /api/analytics/aggregated');
    const aggregatedResponse = await axios.get(`${API_BASE_URL}/analytics/aggregated`);
    console.log('✅ Aggregated data:', JSON.stringify(aggregatedResponse.data, null, 2));
    console.log('');

    // Test 6: Export CSV
    console.log('6️⃣ Testing GET /api/analytics/export (CSV)');
    const csvResponse = await axios.get(`${API_BASE_URL}/analytics/export`, {
      responseType: 'text',
    });
    console.log('✅ CSV export successful');
    console.log('   First 500 characters of CSV:');
    console.log(csvResponse.data.substring(0, 500));
    console.log('   ...');
    console.log('');

    // Test 7: Test trends with different intervals
    console.log('7️⃣ Testing trends with week interval');
    const weekTrendsResponse = await axios.get(
      `${API_BASE_URL}/analytics/trends?startDate=${startDate}&endDate=${endDate}&interval=week`
    );
    console.log('✅ Week trends response:', 
      `${weekTrendsResponse.data.data.length} data points`
    );
    console.log('');

    console.log('8️⃣ Testing trends with month interval');
    const monthTrendsResponse = await axios.get(
      `${API_BASE_URL}/analytics/trends?startDate=${startDate}&endDate=${endDate}&interval=month`
    );
    console.log('✅ Month trends response:', 
      `${monthTrendsResponse.data.data.length} data points`
    );
    console.log('');

    // Test 9: Error handling - missing required parameters
    console.log('9️⃣ Testing error handling - trends without dates');
    try {
      await axios.get(`${API_BASE_URL}/analytics/trends`);
      console.log('❌ Should have thrown an error');
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly returned 400 error:', error.response.data.error.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 10: Error handling - invalid interval
    console.log('🔟 Testing error handling - invalid interval');
    try {
      await axios.get(
        `${API_BASE_URL}/analytics/trends?startDate=${startDate}&endDate=${endDate}&interval=invalid`
      );
      console.log('❌ Should have thrown an error');
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly returned 400 error:', error.response.data.error.message);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('✅ All analytics endpoint tests completed successfully!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

// Run tests
testAnalyticsEndpoints();
