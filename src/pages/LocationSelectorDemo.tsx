import { useState } from 'react';
import { PhotoUpload, LocationSelector } from '@/components/report';
import type { PhotoMetadata } from '@/components/report';
import type { Coordinates, LocationSource } from '@/types';

export default function LocationSelectorDemo() {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationSource, setLocationSource] = useState<LocationSource | null>(null);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);

  const handlePhotosChange = (newPhotos: PhotoMetadata[]) => {
    setPhotos(newPhotos);
  };

  const handleLocationChange = (
    newLocation: Coordinates,
    source: LocationSource,
    acc?: number
  ) => {
    setLocation(newLocation);
    setLocationSource(source);
    setAccuracy(acc);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Location Selector Demo
          </h1>
          <p className="text-gray-600 mb-8">
            Test the location selection interface with photo upload, device GPS, and manual map selection.
          </p>

          <div className="space-y-8">
            {/* Photo Upload Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                1. Upload Photos (Optional)
              </h2>
              <PhotoUpload onPhotosChange={handlePhotosChange} />
            </section>

            {/* Location Selection Section */}
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                2. Select Location
              </h2>
              <LocationSelector
                photos={photos}
                onLocationChange={handleLocationChange}
              />
            </section>

            {/* Summary Section */}
            <section className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Summary
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Photos uploaded:</span>{' '}
                  <span className="text-gray-900">{photos.length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Photos with GPS:</span>{' '}
                  <span className="text-gray-900">
                    {photos.filter(p => p.hasGPS).length}
                  </span>
                </div>
                {location && (
                  <>
                    <div>
                      <span className="font-medium text-gray-700">Selected location:</span>{' '}
                      <span className="text-gray-900">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Location source:</span>{' '}
                      <span className="text-gray-900">{locationSource}</span>
                    </div>
                    {accuracy && (
                      <div>
                        <span className="font-medium text-gray-700">Accuracy:</span>{' '}
                        <span className="text-gray-900">±{accuracy.toFixed(0)}m</span>
                      </div>
                    )}
                  </>
                )}
                {!location && (
                  <div className="text-gray-500 italic">
                    No location selected yet
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
