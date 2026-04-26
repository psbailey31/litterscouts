// Demo page for external environmental data components
import { useState } from 'react';
import { EnvironmentalDataPanel } from '@/components/external';

export function EnvironmentalDataDemo() {
  // Default to a location in Ireland (Dublin Bay)
  const [latitude, setLatitude] = useState(53.3498);
  const [longitude, setLongitude] = useState(-6.2603);

  const handleLocationChange = () => {
    // Example: Switch to another Irish coastal location (Galway Bay)
    if (latitude === 53.3498) {
      setLatitude(53.2707);
      setLongitude(-9.0568);
    } else {
      setLatitude(53.3498);
      setLongitude(-6.2603);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Environmental Data Display
          </h1>
          <p className="text-gray-600">
            View real-time environmental context for coastal locations
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Location</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Latitude: {latitude.toFixed(4)}</p>
              <p className="text-sm text-gray-600">Longitude: {longitude.toFixed(4)}</p>
            </div>
            <button
              onClick={handleLocationChange}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Switch Location
            </button>
          </div>
        </div>

        <EnvironmentalDataPanel latitude={latitude} longitude={longitude} />
      </div>
    </div>
  );
}

export default EnvironmentalDataDemo;
