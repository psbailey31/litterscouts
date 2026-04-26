// Water quality indicator component
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import type { WaterQualityData } from '@/types';
import { externalDataService } from '@/services/externalDataService';

interface WaterQualityIndicatorProps {
  latitude: number;
  longitude: number;
}

export function WaterQualityIndicator({ latitude, longitude }: WaterQualityIndicatorProps) {
  const [waterQuality, setWaterQuality] = useState<WaterQualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchWaterQuality = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await externalDataService.getWaterQuality(latitude, longitude);
        if (mounted) {
          setWaterQuality(data);
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to load water quality data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchWaterQuality();

    return () => {
      mounted = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Loading water quality...</span>
        </div>
      </div>
    );
  }

  if (error || !waterQuality) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Water quality data unavailable</p>
      </div>
    );
  }

  const statusConfig: Record<string, { color: string; text: string; icon: string }> = {
    excellent: { color: 'bg-green-500', text: 'Excellent', icon: '✓' },
    good: { color: 'bg-blue-500', text: 'Good', icon: '✓' },
    sufficient: { color: 'bg-yellow-500', text: 'Sufficient', icon: '!' },
    poor: { color: 'bg-red-500', text: 'Poor', icon: '✗' },
    unknown: { color: 'bg-gray-400', text: 'Unknown', icon: '?' },
  };

  const config = statusConfig[waterQuality.status] || statusConfig.unknown;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">💧</span>
        Water Quality
      </h3>

      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 ${config.color} rounded-full flex items-center justify-center text-white text-xl font-bold`}>
            {config.icon}
          </div>
          <div>
            <div className="font-semibold text-lg">{config.text}</div>
            {waterQuality.lastUpdated && (
              <div className="text-xs text-gray-500">
                Updated: {format(new Date(waterQuality.lastUpdated), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>

        {waterQuality.parameters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Parameters</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {waterQuality.parameters.bacteria !== undefined && (
                <div>
                  <span className="text-gray-600">Bacteria:</span>
                  <span className="ml-2 font-medium">{waterQuality.parameters.bacteria} CFU/100ml</span>
                </div>
              )}
              {waterQuality.parameters.ph !== undefined && (
                <div>
                  <span className="text-gray-600">pH:</span>
                  <span className="ml-2 font-medium">{waterQuality.parameters.ph.toFixed(1)}</span>
                </div>
              )}
              {waterQuality.parameters.temperature !== undefined && (
                <div>
                  <span className="text-gray-600">Temp:</span>
                  <span className="ml-2 font-medium">{waterQuality.parameters.temperature}°C</span>
                </div>
              )}
            </div>
          </div>
        )}

        {waterQuality.source && (
          <div className="text-xs text-gray-500 mt-2">
            Source: {waterQuality.source}
          </div>
        )}
      </div>
    </div>
  );
}
