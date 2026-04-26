// Marine biodiversity information component
import { useEffect, useState } from 'react';
import type { BiodiversityData } from '@/types';
import { externalDataService } from '@/services/externalDataService';

interface BiodiversityInfoProps {
  latitude: number;
  longitude: number;
}

export function BiodiversityInfo({ latitude, longitude }: BiodiversityInfoProps) {
  const [biodiversity, setBiodiversity] = useState<BiodiversityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchBiodiversity = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await externalDataService.getBiodiversity(latitude, longitude);
        if (mounted) {
          setBiodiversity(data);
        }
      } catch (err) {
        if (mounted) {
          setError('Unable to load biodiversity data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBiodiversity();

    return () => {
      mounted = false;
    };
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Loading biodiversity data...</span>
        </div>
      </div>
    );
  }

  if (error || !biodiversity) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-500">Biodiversity data unavailable</p>
      </div>
    );
  }

  // Don't render if there's no meaningful data
  if (!biodiversity.species?.length && !biodiversity.protectedArea && !biodiversity.habitatType) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">🐚</span>
        Marine Biodiversity
      </h3>

      <div className="space-y-3">
        {biodiversity.protectedArea && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 text-xl">🛡️</span>
              <span className="text-sm font-medium text-green-800">Protected Area</span>
            </div>
          </div>
        )}

        {biodiversity.habitatType && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Habitat Type</div>
            <div className="text-sm text-gray-600">{biodiversity.habitatType}</div>
          </div>
        )}

        {biodiversity.conservationStatus && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Conservation Status</div>
            <div className="text-sm text-gray-600">{biodiversity.conservationStatus}</div>
          </div>
        )}

        {biodiversity.species && biodiversity.species.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Notable Species ({biodiversity.species.length})
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {biodiversity.species.map((species, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium text-gray-800">{species.name}</div>
                  {species.scientificName && (
                    <div className="text-xs text-gray-500 italic">{species.scientificName}</div>
                  )}
                  {species.status && (
                    <div className="text-xs text-gray-600 mt-1">
                      Status: {species.status}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
