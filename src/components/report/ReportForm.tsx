import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { PhotoUpload, type PhotoMetadata } from './PhotoUpload';
import { LocationSelector } from './LocationSelector';
import { reportService } from '@/services/reportService';
import type { LitterType, QuantityLevel, LocationSource, Coordinates } from '@/types';

interface EnvironmentalConcern {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface FormData {
  photos: PhotoMetadata[];
  location: Coordinates | null;
  locationSource: LocationSource | null;
  locationAccuracy?: number;
  litterType: LitterType | '';
  quantity: QuantityLevel | '';
  description: string;
  environmentalConcerns: EnvironmentalConcern[];
}

interface FormErrors {
  photos?: string;
  location?: string;
  litterType?: string;
  quantity?: string;
}

const LITTER_TYPES: { value: LitterType; label: string; description: string }[] = [
  { value: 'plastic', label: 'Plastic', description: 'Bottles, bags, packaging, microplastics' },
  { value: 'metal', label: 'Metal', description: 'Cans, foil, wire, metal fragments' },
  { value: 'glass', label: 'Glass', description: 'Bottles, broken glass, jars' },
  { value: 'organic', label: 'Organic', description: 'Food waste, natural debris' },
  { value: 'hazardous', label: 'Hazardous', description: 'Chemicals, batteries, medical waste' },
  { value: 'other', label: 'Other', description: 'Mixed or unclassified litter' },
];

const QUANTITY_LEVELS: { value: QuantityLevel; label: string; description: string }[] = [
  { value: 'minimal', label: 'Minimal', description: '1-10 items, scattered' },
  { value: 'moderate', label: 'Moderate', description: '11-50 items, noticeable' },
  { value: 'significant', label: 'Significant', description: '51-200 items, concentrated' },
  { value: 'severe', label: 'Severe', description: '200+ items, heavily polluted' },
];

const CONCERN_TYPES = [
  'Wildlife hazard',
  'Water contamination',
  'Beach access blocked',
  'Sharp objects',
  'Chemical spill',
  'Other',
];

export function ReportForm() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    photos: [],
    location: null,
    locationSource: null,
    litterType: '',
    quantity: '',
    description: '',
    environmentalConcerns: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const totalSteps = 4;

  const handlePhotosChange = (photos: PhotoMetadata[]) => {
    setFormData(prev => ({ ...prev, photos }));
    if (photos.length > 0 && errors.photos) {
      setErrors(prev => ({ ...prev, photos: undefined }));
    }
  };

  const handleLocationChange = (location: Coordinates, source: LocationSource, accuracy?: number) => {
    setFormData(prev => ({
      ...prev,
      location,
      locationSource: source,
      locationAccuracy: accuracy,
    }));
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      if (formData.photos.length === 0) {
        newErrors.photos = 'At least one photo is required';
      }
    }

    if (step === 2) {
      if (!formData.location) {
        newErrors.location = 'Location is required';
      }
    }

    if (step === 3) {
      if (!formData.litterType) {
        newErrors.litterType = 'Please select a litter type';
      }
      if (!formData.quantity) {
        newErrors.quantity = 'Please select a quantity level';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (!formData.location || !formData.locationSource || !formData.litterType || !formData.quantity) {
      setSubmitError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: Upload photos
      setUploadProgress('Uploading photos...');
      const photoUrls: string[] = [];
      
      for (let i = 0; i < formData.photos.length; i++) {
        const photo = formData.photos[i];
        if (!photo) continue;
        
        setUploadProgress(`Uploading photo ${i + 1} of ${formData.photos.length}...`);
        const uploadResult = await reportService.uploadPhoto(photo.file);
        photoUrls.push(uploadResult.url);
      }

      // Step 2: Submit report
      setUploadProgress('Creating report...');
      const reportData = {
        latitude: formData.location!.latitude,
        longitude: formData.location!.longitude,
        locationSource: formData.locationSource!,
        litterType: formData.litterType as LitterType,
        quantity: formData.quantity as QuantityLevel,
        description: formData.description || undefined,
        photoUrls,
        photoTimestamp: formData.photos[0]?.timestamp?.toISOString(),
        environmentalConcerns: formData.environmentalConcerns.length > 0 
          ? formData.environmentalConcerns.filter(c => c.type && c.description)
          : undefined,
      };

      await reportService.createReport(reportData);
      
      setUploadProgress('Report submitted successfully!');
      
      // Show success message
      setTimeout(() => {
        // Reset form
        setFormData({
          photos: [],
          location: null,
          locationSource: null,
          litterType: '',
          quantity: '',
          description: '',
          environmentalConcerns: [],
        });
        setCurrentStep(1);
        setUploadProgress('');
        
        // Navigate to map page to see the new report
        navigate('/map');
      }, 1500);
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit report. Please try again.');
      setUploadProgress('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEnvironmentalConcern = () => {
    setFormData(prev => ({
      ...prev,
      environmentalConcerns: [
        ...prev.environmentalConcerns,
        { type: '', severity: 'medium', description: '' },
      ],
    }));
  };

  const updateEnvironmentalConcern = (index: number, field: keyof EnvironmentalConcern, value: string) => {
    setFormData(prev => ({
      ...prev,
      environmentalConcerns: prev.environmentalConcerns.map((concern, i) =>
        i === index ? { ...concern, [field]: value } : concern
      ),
    }));
  };

  const removeEnvironmentalConcern = (index: number) => {
    setFormData(prev => ({
      ...prev,
      environmentalConcerns: prev.environmentalConcerns.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Authentication Warning */}
      {isLoaded && !isSignedIn && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Authentication Required</h3>
              <p className="mt-1 text-sm text-yellow-700">
                You must be signed in to submit a report. Please{' '}
                <a href="/sign-in" className="font-medium underline hover:text-yellow-900">
                  sign in
                </a>{' '}
                or{' '}
                <a href="/sign-up" className="font-medium underline hover:text-yellow-900">
                  create an account
                </a>{' '}
                to continue.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm
                    ${step < currentStep
                      ? 'bg-green-500 text-white'
                      : step === currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}
                >
                  {step < currentStep ? (
                    <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium text-gray-600 text-center hidden xs:block">
                  {step === 1 && 'Photos'}
                  {step === 2 && 'Location'}
                  {step === 3 && 'Details'}
                  {step === 4 && 'Review'}
                </div>
              </div>
              {step < totalSteps && (
                <div
                  className={`
                    h-0.5 sm:h-1 flex-1 mx-1 sm:mx-2
                    ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8">
        {/* Step 1: Photos */}
        {currentStep === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Upload Photos</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Take or upload photos of the litter. Photos with GPS data will auto-populate the location.
              </p>
            </div>

            <PhotoUpload onPhotosChange={handlePhotosChange} />

            {errors.photos && (
              <p className="text-sm text-red-600">{errors.photos}</p>
            )}
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Select Location</h2>
              <p className="text-sm sm:text-base text-gray-600">
                Confirm or select the location where the litter was found.
              </p>
            </div>

            <LocationSelector
              photos={formData.photos}
              onLocationChange={handleLocationChange}
              initialLocation={formData.location || undefined}
            />

            {errors.location && (
              <p className="text-sm text-red-600">{errors.location}</p>
            )}
          </div>
        )}

        {/* Step 3: Litter Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Litter Details</h2>
              <p className="text-gray-600">
                Provide information about the type and quantity of litter.
              </p>
            </div>

            {/* Litter Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Litter Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LITTER_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, litterType: type.value }));
                      if (errors.litterType) {
                        setErrors(prev => ({ ...prev, litterType: undefined }));
                      }
                    }}
                    className={`
                      text-left p-4 rounded-lg border-2 transition-all
                      ${formData.litterType === type.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="font-semibold text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
              {errors.litterType && (
                <p className="text-sm text-red-600 mt-2">{errors.litterType}</p>
              )}
            </div>

            {/* Quantity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quantity Level <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {QUANTITY_LEVELS.map((level, index) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, quantity: level.value }));
                      if (errors.quantity) {
                        setErrors(prev => ({ ...prev, quantity: undefined }));
                      }
                    }}
                    className={`
                      w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4
                      ${formData.quantity === level.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    {/* Visual Indicator */}
                    <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`
                            w-3 h-8 rounded
                            ${i <= index
                              ? formData.quantity === level.value
                                ? 'bg-blue-600'
                                : 'bg-gray-400'
                              : 'bg-gray-200'
                            }
                          `}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.quantity && (
                <p className="text-sm text-red-600 mt-2">{errors.quantity}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Description (Optional)
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide any additional details about the litter, its condition, or the surrounding area..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={500}
              />
              <div className="text-sm text-gray-500 mt-1 text-right">
                {formData.description.length}/500 characters
              </div>
            </div>

            {/* Environmental Concerns */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Environmental Concerns (Optional)
                </label>
                <button
                  type="button"
                  onClick={addEnvironmentalConcern}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Concern
                </button>
              </div>

              {formData.environmentalConcerns.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No environmental concerns added. Click "Add Concern" to report specific hazards or issues.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.environmentalConcerns.map((concern, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Concern {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeEnvironmentalConcern(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={concern.type}
                          onChange={(e) => updateEnvironmentalConcern(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Select type...</option>
                          {CONCERN_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
                        <div className="grid grid-cols-4 gap-2">
                          {(['low', 'medium', 'high', 'critical'] as const).map((severity) => (
                            <button
                              key={severity}
                              type="button"
                              onClick={() => updateEnvironmentalConcern(index, 'severity', severity)}
                              className={`
                                px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors
                                ${concern.severity === severity
                                  ? severity === 'low' ? 'bg-green-600 text-white'
                                  : severity === 'medium' ? 'bg-yellow-600 text-white'
                                  : severity === 'high' ? 'bg-orange-600 text-white'
                                  : 'bg-red-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }
                              `}
                            >
                              {severity}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={concern.description}
                          onChange={(e) => updateEnvironmentalConcern(index, 'description', e.target.value)}
                          placeholder="Describe the environmental concern..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                          maxLength={200}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Report</h2>
              <p className="text-gray-600">
                Please review all information before submitting.
              </p>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-medium text-red-900">Submission Error</h3>
                  <p className="text-sm text-red-700 mt-1">{submitError}</p>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-blue-900 font-medium">{uploadProgress}</p>
              </div>
            )}

            {/* Photos Summary */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Photos</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {formData.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.preview}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            </div>

            {/* Location Summary */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
              {formData.location && formData.locationSource && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Coordinates:</span>{' '}
                    {formData.location.latitude.toFixed(6)}, {formData.location.longitude.toFixed(6)}
                  </p>
                  <p>
                    <span className="font-medium">Source:</span>{' '}
                    {formData.locationSource === 'exif' ? 'Photo EXIF data' :
                     formData.locationSource === 'gps' ? 'Device GPS' : 'Manual selection'}
                  </p>
                </div>
              )}
            </div>

            {/* Litter Details Summary */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Litter Details</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <span className="font-medium">Type:</span>{' '}
                  {LITTER_TYPES.find(t => t.value === formData.litterType)?.label}
                </p>
                <p>
                  <span className="font-medium">Quantity:</span>{' '}
                  {QUANTITY_LEVELS.find(q => q.value === formData.quantity)?.label}
                </p>
                {formData.description && (
                  <p>
                    <span className="font-medium">Description:</span>{' '}
                    {formData.description}
                  </p>
                )}
              </div>
            </div>

            {/* Environmental Concerns Summary */}
            {formData.environmentalConcerns.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Environmental Concerns</h3>
                <div className="space-y-3">
                  {formData.environmentalConcerns.map((concern, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{concern.type}</span>
                        <span
                          className={`
                            px-2 py-1 rounded text-xs font-medium capitalize
                            ${concern.severity === 'low' ? 'bg-green-100 text-green-800' :
                              concern.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              concern.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'}
                          `}
                        >
                          {concern.severity}
                        </span>
                      </div>
                      {concern.description && (
                        <p className="text-gray-700">{concern.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            style={{ minHeight: '44px' }}
          >
            Back
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
