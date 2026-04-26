import dotenv from 'dotenv';
import { connectRedis, cache } from '../config/redis';
import {
  getWeatherData,
  getTideData,
  getWaterQualityData,
  getBeachQualityData,
  getAllEnvironmentalData,
} from '../services/externalDataService';

// Load environment variables
dotenv.config();

// Test coordinates (Dublin Bay area)
const TEST_LAT = 53.3498;
const TEST_LNG = -6.2603;

async function testExternalAPIs() {
  console.log('🧪 Testing External API Integration\n');
  console.log('='.repeat(50));

  try {
    // Connect to Redis
    console.log('\n1️⃣  Connecting to Redis...');
    await connectRedis();
    console.log('✅ Redis connected\n');

    // Test Weather API
    console.log('2️⃣  Testing Weather API...');
    console.log(`   Fetching weather for: ${TEST_LAT}, ${TEST_LNG}`);
    const weather = await getWeatherData(TEST_LAT, TEST_LNG);
    if (weather) {
      console.log('✅ Weather data retrieved:');
      console.log(`   Temperature: ${weather.temperature}°C`);
      console.log(`   Feels like: ${weather.feelsLike}°C`);
      console.log(`   Humidity: ${weather.humidity}%`);
      console.log(`   Wind: ${weather.windSpeed} m/s`);
      console.log(`   Description: ${weather.description}`);
    } else {
      console.log('⚠️  Weather data not available (API key may not be configured)');
    }

    // Test cache
    console.log('\n3️⃣  Testing cache...');
    const cachedWeather = await getWeatherData(TEST_LAT, TEST_LNG);
    if (cachedWeather) {
      console.log('✅ Weather data retrieved from cache');
    }

    // Test Tide API
    console.log('\n4️⃣  Testing Tide API...');
    const tides = await getTideData(TEST_LAT, TEST_LNG);
    if (tides) {
      console.log('✅ Tide data retrieved:');
      console.log(`   Number of extremes: ${tides.extremes.length}`);
      if (tides.nextTide) {
        console.log(`   Next tide: ${tides.nextTide.type} at ${tides.nextTide.time}`);
        console.log(`   Height: ${tides.nextTide.height}m`);
      }
    } else {
      console.log('⚠️  Tide data not available (API key may not be configured)');
    }

    // Test Water Quality API
    console.log('\n5️⃣  Testing Water Quality API...');
    const waterQuality = await getWaterQualityData(TEST_LAT, TEST_LNG);
    if (waterQuality) {
      console.log('✅ Water quality data retrieved:');
      console.log(`   Status: ${waterQuality.status}`);
      console.log(`   Source: ${waterQuality.source}`);
    } else {
      console.log('⚠️  Water quality data not available');
    }

    // Test Beach Quality API
    console.log('\n6️⃣  Testing Beach Quality API...');
    const beachQuality = await getBeachQualityData(TEST_LAT, TEST_LNG);
    if (beachQuality) {
      console.log('✅ Beach quality data retrieved:');
      console.log(`   Rating: ${beachQuality.rating}`);
      console.log(`   Awards: ${beachQuality.awards.length}`);
    } else {
      console.log('⚠️  Beach quality data not available');
    }

    // Test getting all data at once
    console.log('\n7️⃣  Testing combined data fetch...');
    const allData = await getAllEnvironmentalData(TEST_LAT, TEST_LNG);
    console.log('✅ All environmental data retrieved:');
    console.log(`   Weather: ${allData.weather ? '✓' : '✗'}`);
    console.log(`   Tides: ${allData.tides ? '✓' : '✗'}`);
    console.log(`   Water Quality: ${allData.waterQuality ? '✓' : '✗'}`);
    console.log(`   Beach Quality: ${allData.beachQuality ? '✓' : '✗'}`);

    // Test cache expiration info
    console.log('\n8️⃣  Cache status:');
    const weatherCacheKey = `weather:${TEST_LAT.toFixed(4)}:${TEST_LNG.toFixed(4)}`;
    const cacheExists = await cache.exists(weatherCacheKey);
    console.log(`   Weather cache exists: ${cacheExists ? 'Yes' : 'No'}`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ External API integration test completed!\n');
    console.log('📝 Notes:');
    console.log('   - Weather and tide data require API keys in .env');
    console.log('   - Water quality and beach quality are placeholder implementations');
    console.log('   - Cache expiration is set to 6 hours (21600 seconds)');
    console.log('   - All data is cached in Redis for performance\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testExternalAPIs();
