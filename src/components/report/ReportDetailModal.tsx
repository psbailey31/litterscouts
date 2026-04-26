// Modal component for displaying detailed report information
import { useState, useEffect, useRef } from 'react';
import type { ReportResponseDTO } from '@/types';
import { format } from 'date-fns';
import { getApiBaseUrl } from '@/services/api';

interface ReportDetailModalProps {
  report: ReportResponseDTO;
  isOpen: boolean;
  onClose: () => void;
  onVerify?: (reportId: string, comment?: string) => void;
  onDispute?: (reportId: string, comment?: string) => void;
  onMarkCleaned?: (reportId: string) => void;
}

export function ReportDetailModal({ report, isOpen, onClose, onVerify, onDispute, onMarkCleaned }: ReportDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showVerifyComment, setShowVerifyComment] = useState(false);
  const [showDisputeComment, setShowDisputeComment] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [comment, setComment] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;
      const focusable = modalRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.querySelector<HTMLElement>('button')?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen || !report) return null;

  const handleVerify = () => {
    if (onVerify) {
      onVerify(report.id, comment || undefined);
      setShowVerifyComment(false);
      setComment('');
    }
  };

  const handleDispute = () => {
    if (onDispute) {
      onDispute(report.id, comment || undefined);
      setShowDisputeComment(false);
      setComment('');
    }
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % report.photoUrls.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + report.photoUrls.length) % report.photoUrls.length);
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disputed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'disputed':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getLitterTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      plastic: 'Plastic',
      metal: 'Metal',
      glass: 'Glass',
      organic: 'Organic',
      hazardous: 'Hazardous',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const getQuantityLabel = (quantity: string) => {
    const labels: Record<string, string> = {
      minimal: 'Minimal (1-10 items)',
      moderate: 'Moderate (11-50 items)',
      significant: 'Significant (51-200 items)',
      severe: 'Severe (200+ items)',
    };
    return labels[quantity] || quantity;
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div ref={modalRef} className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto z-[10000]">
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close report details"
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Photo Gallery */}
          <div className="relative bg-gray-900">
            <img
              src={
                report.photoUrls[currentPhotoIndex].startsWith('http')
                  ? report.photoUrls[currentPhotoIndex]
                  : `${getApiBaseUrl()}${report.photoUrls[currentPhotoIndex]}`
              }
              alt={`Report photo ${currentPhotoIndex + 1}`}
              className="w-full h-80 object-contain"
            />

            {/* Photo Navigation */}
            {report.photoUrls.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  aria-label="Previous photo"
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white bg-opacity-75 hover:bg-opacity-100 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  aria-label="Next photo"
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white bg-opacity-75 hover:bg-opacity-100 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Photo Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black bg-opacity-75 text-white text-sm">
                  {currentPhotoIndex + 1} / {report.photoUrls.length}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Header with Verification Status */}
            <div className="flex items-start justify-between">
              <div>
                <h2 id="report-modal-title" className="text-xl font-bold text-gray-900">Litter Report</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Reported {format(new Date(report.createdAt), 'PPP')} at {format(new Date(report.createdAt), 'p')}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getVerificationStatusColor(report.verificationStatus)}`}>
                {getVerificationStatusIcon(report.verificationStatus)}
                <span className="font-medium capitalize">{report.verificationStatus}</span>
              </div>
            </div>

            {/* Litter Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Litter Type</p>
                <p className="font-semibold text-gray-900">{getLitterTypeLabel(report.litterType)}</p>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Quantity</p>
                <p className="font-semibold text-gray-900">{getQuantityLabel(report.quantity)}</p>
              </div>
            </div>

            {/* Location and Photo Timestamp */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Location</p>
                <div className="space-y-1">
                  <p className="font-mono text-sm text-gray-900">
                    {Number(report.latitude).toFixed(6)}, {Number(report.longitude).toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Source: {report.locationSource === 'exif' ? 'Photo EXIF data' : 
                             report.locationSource === 'gps' ? 'Device GPS' : 'Manual selection'}
                  </p>
                </div>
              </div>

              {report.photoTimestamp && (
                <div className="p-3 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Photo Taken</p>
                  <p className="text-gray-900">
                    {format(new Date(report.photoTimestamp), 'PPP')} at {format(new Date(report.photoTimestamp), 'p')}
                  </p>
                </div>
              )}
            </div>

            {/* Cleaned Status */}
            {report.cleanedAt && (
              <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-semibold text-green-800">Cleaned Up</p>
                </div>
                <p className="text-sm text-green-700">
                  This litter was cleaned up on {format(new Date(report.cleanedAt), 'PPP')}
                </p>
                {report.cleanedByUserId && (
                  <p className="text-xs text-green-600 mt-1">
                    Marked as cleaned by a community member
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            {report.description && (
              <div className="p-3 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-900">{report.description}</p>
              </div>
            )}

            {/* Environmental Concerns */}
            {report.environmentalConcerns && report.environmentalConcerns.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-500 mb-3">Environmental Concerns</p>
                <div className="space-y-3">
                  {report.environmentalConcerns.map((concern) => (
                    <div key={concern.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{concern.concernType}</span>
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
                      <p className="text-sm text-gray-700">{concern.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Stats */}
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Verification Status</h3>
                {report.verifications && report.verifications.length > 0 && (
                  <button
                    onClick={() => setShowAuditLog(!showAuditLog)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    {showAuditLog ? 'Hide' : 'Show'} Audit Log
                    <svg 
                      className={`w-4 h-4 transition-transform ${showAuditLog ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{report.verificationCount || 0}</span> verifications
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">
                    <span className="font-semibold">{report.disputeCount || 0}</span> disputes
                  </span>
                </div>
              </div>

              {/* Auto-hide warning for disputed reports */}
              {(report.disputeCount || 0) >= 3 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">Report Disputed</p>
                    <p className="text-xs text-red-700 mt-1">
                      This report has received 3 or more disputes and is hidden from public view pending review.
                    </p>
                  </div>
                </div>
              )}

              {/* Audit Log */}
              {showAuditLog && report.verifications && report.verifications.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="border-t border-gray-200 pt-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Verification History</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {report.verifications
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((verification) => (
                          <div 
                            key={verification.id} 
                            className={`p-3 rounded-lg border ${
                              verification.verificationType === 'verify' 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {verification.verificationType === 'verify' ? (
                                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                )}
                                <span className="text-sm font-medium text-gray-900">
                                  {verification.user.username}
                                </span>
                                <span className={`text-xs font-medium ${
                                  verification.verificationType === 'verify' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {verification.verificationType === 'verify' ? 'verified' : 'disputed'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {format(new Date(verification.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {verification.comment && (
                              <p className="text-sm text-gray-700 mt-2 pl-6">
                                "{verification.comment}"
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {(onVerify || onDispute || onMarkCleaned) && !report.cleanedAt && (
              <div className="border-t border-gray-200 pt-4">
                {(onVerify || onDispute) && (
                  <p className="text-sm text-gray-700 mb-3">
                    Help maintain data quality by verifying or disputing this report.
                  </p>
                )}
                
                {!showVerifyComment && !showDisputeComment && (
                  <div className="flex gap-3">
                    {onVerify && (
                      <button
                        onClick={() => setShowVerifyComment(true)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verify
                      </button>
                    )}
                    {onDispute && (
                      <button
                        onClick={() => setShowDisputeComment(true)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Dispute
                      </button>
                    )}
                    {onMarkCleaned && (
                      <button
                        onClick={() => onMarkCleaned(report.id)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Mark as Cleaned
                      </button>
                    )}
                  </div>
                )}

                {/* Verify Comment Form */}
                {showVerifyComment && (
                  <div className="space-y-3">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Optional: Add a comment about why you're verifying this report..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleVerify}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        Confirm Verification
                      </button>
                      <button
                        onClick={() => {
                          setShowVerifyComment(false);
                          setComment('');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Dispute Comment Form */}
                {showDisputeComment && (
                  <div className="space-y-3">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Optional: Explain why you're disputing this report..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleDispute}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        Confirm Dispute
                      </button>
                      <button
                        onClick={() => {
                          setShowDisputeComment(false);
                          setComment('');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
