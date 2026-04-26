import { useState } from 'react';
import { PhotoUpload, PhotoMetadata } from '@/components/report';

export function PhotoUploadDemo() {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);

  const handlePhotosChange = (updatedPhotos: PhotoMetadata[]) => {
    setPhotos(updatedPhotos);
    console.log('Photos updated:', updatedPhotos);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Photo Upload Component Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Upload photos to test EXIF extraction and validation
          </p>

          <PhotoUpload 
            onPhotosChange={handlePhotosChange}
            maxFiles={5}
            maxSizeMB={5}
          />

          {photos.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Extracted Metadata
              </h2>
              <div className="space-y-4">
                {photos.map((photo, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Photo {index + 1}: {photo.file.name}
                    </h3>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-gray-600">File Size:</dt>
                      <dd className="text-gray-900">
                        {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                      </dd>
                      
                      <dt className="text-gray-600">File Type:</dt>
                      <dd className="text-gray-900">{photo.file.type}</dd>
                      
                      <dt className="text-gray-600">Has GPS:</dt>
                      <dd className={photo.hasGPS ? 'text-green-600' : 'text-red-600'}>
                        {photo.hasGPS ? 'Yes' : 'No'}
                      </dd>
                      
                      {photo.latitude && (
                        <>
                          <dt className="text-gray-600">Latitude:</dt>
                          <dd className="text-gray-900">{photo.latitude.toFixed(6)}</dd>
                        </>
                      )}
                      
                      {photo.longitude && (
                        <>
                          <dt className="text-gray-600">Longitude:</dt>
                          <dd className="text-gray-900">{photo.longitude.toFixed(6)}</dd>
                        </>
                      )}
                      
                      {photo.timestamp && (
                        <>
                          <dt className="text-gray-600">Timestamp:</dt>
                          <dd className="text-gray-900">
                            {photo.timestamp.toLocaleString()}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoUploadDemo;
