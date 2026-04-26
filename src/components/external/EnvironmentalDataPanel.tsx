// Composite panel displaying all external environmental data
import { WeatherWidget } from './WeatherWidget';
import { TideDisplay } from './TideDisplay';
import { WaterQualityIndicator } from './WaterQualityIndicator';
import { BiodiversityInfo } from './BiodiversityInfo';

interface EnvironmentalDataPanelProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export function EnvironmentalDataPanel({
  latitude,
  longitude,
  className = '',
}: EnvironmentalDataPanelProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Environmental Context</h2>
        <p className="text-sm text-gray-600">
          Weather, tide, water quality, and biodiversity data for this location
        </p>
      </div>

      <WeatherWidget latitude={latitude} longitude={longitude} />
      <TideDisplay latitude={latitude} longitude={longitude} />
      <WaterQualityIndicator latitude={latitude} longitude={longitude} />
      <BiodiversityInfo latitude={latitude} longitude={longitude} />
    </div>
  );
}
