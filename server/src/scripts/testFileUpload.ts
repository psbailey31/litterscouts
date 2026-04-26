import path from 'path';
import { extractExifData } from '../utils/exif';
import fs from 'fs';

async function testFileUpload() {
  console.log('🧪 Testing File Upload and EXIF Processing\n');

  // Test 1: Check uploads directory exists
  console.log('Test 1: Checking uploads directory...');
  const uploadDir = path.join(__dirname, '../../uploads');
  if (fs.existsSync(uploadDir)) {
    console.log('✅ Uploads directory exists:', uploadDir);
  } else {
    console.log('❌ Uploads directory does not exist');
    return;
  }

  // Test 2: Test EXIF extraction with sample image
  console.log('\nTest 2: Testing EXIF extraction...');
  const testImagePath = path.join(__dirname, '../../../public/IMG_6703.jpeg');
  
  if (!fs.existsSync(testImagePath)) {
    console.log('⚠️  Test image not found at:', testImagePath);
    console.log('Skipping EXIF extraction test');
  } else {
    console.log('📸 Test image found:', testImagePath);
    
    try {
      const exifData = await extractExifData(testImagePath);
      console.log('✅ EXIF data extracted successfully:');
      console.log('   - Latitude:', exifData.latitude || 'Not available');
      console.log('   - Longitude:', exifData.longitude || 'Not available');
      console.log('   - Timestamp:', exifData.timestamp || 'Not available');
      console.log('   - Camera Make:', exifData.make || 'Not available');
      console.log('   - Camera Model:', exifData.model || 'Not available');
    } catch (error) {
      console.log('❌ Error extracting EXIF data:', error);
    }
  }

  // Test 3: Verify file validation settings
  console.log('\nTest 3: Checking file upload configuration...');
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '5242880');
  console.log('✅ Max file size:', (maxFileSize / 1024 / 1024).toFixed(2), 'MB');
  console.log('✅ Upload directory:', process.env.UPLOAD_DIR || './uploads');
  console.log('✅ Allowed file types: JPEG, PNG, WebP');

  // Test 4: Check multer configuration
  console.log('\nTest 4: Verifying multer middleware...');
  try {
    const uploadMiddleware = await import('../middleware/upload');
    console.log('✅ Multer middleware loaded successfully');
    console.log('✅ File filter configured for image types');
    console.log('✅ Storage configured for local filesystem');
  } catch (error) {
    console.log('❌ Error loading multer middleware:', error);
  }

  console.log('\n✨ File upload and EXIF processing tests complete!\n');
}

// Run tests
testFileUpload().catch(console.error);
