// Beach quality rating display component
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { BeachQualityData } from '@/types';
import { externalDataService } from '@/services/externalDataService';

interface BeachQualityDisplayProps {
  latitude: number;
  longitude: number;
}

export function BeachQualityDisplay({ latitude, longitude }: BeachQualityDisplayProps) {
  const [beachQuality, setBeachQuality] = useState<BeachQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchBeachQuality = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await externalDataService.getBeachQuality(latitude, longitude);
        if (mounted) {
          setBeachQuality(data);
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to load beach quality data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBeachQuality();

    return () => {
      mounted = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Loading beach quality...</span>
        </div>
      </div>
    );
  }

  if (error || !beachQuality) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Beach quality data unavailable</p>
      </div>
    );
  }

  const ratingConfig = {
    'blue-flag': { color: 'text-blue-600', icon: '🏴', label: 'Blue Flag Award' },
    'green-coast': { color: 'text-green-600', icon: '🌿', label: 'Green Coast Award' },
    'excellent': { color: 'text-green-600', icon: '⭐', label: 'Excellent' },
    'good': { color: 'text-blue-600', icon: '✓', label: 'Good' },
    'adequate': { color: 'text-yellow-600', icon: '○', label: 'Adequate' },
    'poor': { color: 'text-red-600', icon: '✗', label: 'Poor' },
    'unknown': { color: 'text-gray-500', icon: '?', label: 'Unknown' },
  };

  const config = ratingConfig[beachQuality.rating];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">🏖️</span>
        Beach Quality
      </h3>

      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <div className={`font-semibold text-lg ${config.color}`}>
              {config.label}
            </div>
            {beachQuality.lastInspection && (
              <div className="text-xs text-gray-500">
                Last inspection: {format(new Date(beachQuality.lastInspection), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>

        {beachQuality.awards && beachQuality.awards.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Awards & Certifications</div>
            <div className="flex flex-wrap gap-2">
              {beachQuality.awards.map((award, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {award}
                </span>
              ))}
            </div>
          </div>
        )}

        {beachQuality.facilities && beachQuality.facilities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Facilities</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {beachQuality.facilities.map((facility, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">{facility}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
