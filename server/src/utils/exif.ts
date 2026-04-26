import exifr from 'exifr';

export interface ExifData {
  latitude?: number;
  longitude?: number;
  timestamp?: Date;
  make?: string;
  model?: string;
}

export async function extractExifData(filePath: string): Promise<ExifData> {
  try {
    const exif = await exifr.parse(filePath, {
      gps: true,
      pick: ['latitude', 'longitude', 'DateTimeOriginal', 'Make', 'Model'],
    });

    if (!exif) {
      return {};
    }

    return {
      latitude: exif.latitude,
      longitude: exif.longitude,
      timestamp: exif.DateTimeOriginal,
      make: exif.Make,
      model: exif.Model,
    };
  } catch (error) {
    console.error('Error extracting EXIF data:', error);
    return {};
  }
}
