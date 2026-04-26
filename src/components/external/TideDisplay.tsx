// Tide times display component
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { TideData } from '@/types';
import { externalDataService } from '@/services/externalDataService';

interface TideDisplayProps {
  latitude: number;
  longitude: number;
}

export function TideDisplay({ latitude, longitude }: TideDisplayProps) {
  const [tideData, setTideData] = useState<TideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchTides = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await externalDataService.getTides(latitude, longitude);
        if (mounted) {
          setTideData(data);
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to load tide data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTides();

    return () => {
      mounted = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Loading tide data...</span>
        </div>
      </div>
    );
  }

  if (error || !tideData) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Tide data unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">🌊</span>
        Tide Times
      </h3>

      {tideData.nextTide && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Next Tide</div>
          <div className="flex items-center justify-between">
            <span className="font-semibold capitalize">{tideData.nextTide.type} Tide</span>
            <span className="text-sm">{format(new Date(tideData.nextTide.time), 'HH:mm')}</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Height: {tideData.nextTide.height.toFixed(2)}m
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700 mb-2">Today's Tides</div>
        {tideData.extremes && tideData.extremes.slice(0, 4).map((tide, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">{tide.type === 'High' ? '⬆️' : '⬇️'}</span>
              <div>
                <div className="font-medium capitalize">{tide.type} Tide</div>
                <div className="text-xs text-gray-500">
                  {format(new Date(tide.time), 'HH:mm')}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">{tide.height.toFixed(2)}m</div>
          </div>
        ))}
      </div>
    </div>
  );
}
