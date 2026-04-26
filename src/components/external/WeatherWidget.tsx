// Weather information widget component
import { useEffect, useState } from 'react';
import type { WeatherData } from '@/types';
import { externalDataService } from '@/services/externalDataService';

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
}

export function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await externalDataService.getWeather(latitude, longitude);
        if (mounted) {
          setWeather(data);
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to load weather data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchWeather();

    return () => {
      mounted = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Weather data unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">🌤️</span>
        Weather Conditions
      </h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{Math.round(weather.temperature)}°C</span>
          <span className="text-gray-600 capitalize">{weather.description}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Feels like:</span>
            <span className="ml-2 font-medium">{Math.round(weather.feelsLike)}°C</span>
          </div>
          <div>
            <span className="text-gray-600">Humidity:</span>
            <span className="ml-2 font-medium">{weather.humidity}%</span>
          </div>
          <div>
            <span className="text-gray-600">Wind:</span>
            <span className="ml-2 font-medium">{Math.round(weather.windSpeed * 3.6)} km/h</span>
          </div>
          <div>
            <span className="text-gray-600">Direction:</span>
            <span className="ml-2 font-medium">{getWindDirection(weather.windDirection)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index] || 'N';
}
