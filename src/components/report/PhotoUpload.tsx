import { useState, useCallback, useRef } from 'react';
import exifr from 'exifr';

interface PhotoMetadata {
  file: File;
  preview: string;
  latitude?: number;
  longitude?: number;
  timestamp?: Date;
  hasGPS: boolean;
}

interface PhotoUploadProps {
  onPhotosChange: (photos: PhotoMetadata[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_MAX_FILES = 5;

export function PhotoUpload({ 
  onPhotosChange, 
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeMB = DEFAULT_MAX_SIZE_MB 
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractEXIF = async (file: File): Promise<Partial<PhotoMetadata>> => {
    try {
      // Parse GPS data separately to get computed latitude/longitude
      const gpsData = await exifr.gps(file);
      
      // Parse other EXIF data for timestamp
      const exifData = await exifr.parse(file, {
        pick: ['DateTimeOriginal', 'CreateDate', 'DateTime']
      });

      const latitude = gpsData?.latitude;
      const longitude = gpsData?.longitude;
      const timestamp = exifData?.DateTimeOriginal || exifData?.CreateDate || exifData?.DateTime;

      return {
        latitude: latitude !== undefined ? latitude : undefined,
        longitude: longitude !== undefined ? longitude : undefined,
        timestamp: timestamp ? new Date(timestamp) : undefined,
        hasGPS: latitude !== undefined && longitude !== undefined
      };
    } catch (error) {
      console.error('Error extracting EXIF data:', error);
      return { hasGPS: false };
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name}: Invalid file type. Only JPEG, PNG, and WebP images are allowed.`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `${file.name}: File size (${sizeMB.toFixed(1)}MB) exceeds maximum of ${maxSizeMB}MB.`;
    }

    return null;
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];

    // Check total file count
    if (photos.length + fileArray.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} photos allowed. You can upload ${maxFiles - photos.length} more.`);
      setErrors(newErrors);
      return;
    }

    // Validate and process each file
    const validFiles: File[] = [];
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
    } else {
      setErrors([]);
    }

    // Process valid files
    const newPhotos: PhotoMetadata[] = [];
    for (const file of validFiles) {
      const preview = URL.createObjectURL(file);
      const exifData = await extractEXIF(file);
      
      newPhotos.push({
        file,
        preview,
        ...exifData,
        hasGPS: exifData.hasGPS || false
      });
    }

    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  }, [photos, maxFiles, maxSizeMB, onPhotosChange]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    const photoToRemove = photos[index];
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.preview);
    }
    
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <div className="text-sm text-gray-600">
            <button
              type="button"
              onClick={handleBrowseClick}
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
            >
              Browse files
            </button>
            {' or drag and drop'}
          </div>
          
          <p className="text-xs text-gray-500">
            JPEG, PNG, WebP up to {maxSizeMB}MB each (max {maxFiles} photos)
          </p>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Upload errors:
              </h3>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">
            Uploaded Photos ({photos.length}/{maxFiles})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo.preview}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  aria-label="Remove photo"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Metadata Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-2 rounded-b-lg">
                  <div className="flex items-center gap-1">
                    {photo.hasGPS ? (
                      <>
                        <svg className="h-3 w-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-400">GPS: {photo.latitude?.toFixed(4)}, {photo.longitude?.toFixed(4)}</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-yellow-400">No GPS data</span>
                      </>
                    )}
                  </div>
                  {photo.timestamp && (
                    <div className="text-gray-300 mt-1">
                      {photo.timestamp.toLocaleDateString()} {photo.timestamp.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type { PhotoMetadata };
