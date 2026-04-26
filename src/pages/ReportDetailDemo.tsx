// Demo page for ReportDetailModal component
import { useState } from 'react';
import { ReportDetailModal } from '@/components/report';
import type { ReportResponseDTO } from '@/types';

// Mock report data for demonstration
const mockReport: ReportResponseDTO = {
  id: 'demo-report-1',
  userId: 'user-123',
  latitude: 53.3498,
  longitude: -6.2603,
  locationSource: 'gps',
  photoUrls: [
    'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800',
    'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800',
  ],
  photoTimestamp: new Date('2024-11-15T14:30:00Z'),
  litterType: 'plastic',
  quantity: 'significant',
  description: 'Large amount of plastic bottles and bags scattered along the shoreline. Some items appear to be recent, while others show signs of weathering. The area is popular with tourists and locals.',
  createdAt: new Date('2024-11-15T15:00:00Z'),
  updatedAt: new Date('2024-11-15T15:00:00Z'),
  submittedAt: new Date('2024-11-15T15:00:00Z'),
  verificationStatus: 'verified',
  user: {
    id: 'user-123',
    username: 'beachguardian',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=beachguardian',
  },
  verificationCount: 5,
  disputeCount: 0,
  environmentalConcerns: [
    {
      id: 'concern-1',
      reportId: 'demo-report-1',
      concernType: 'Wildlife hazard',
      severity: 'high',
      description: 'Plastic bags pose entanglement risk for seabirds and marine life in the area.',
      createdAt: new Date('2024-11-15T15:00:00Z'),
    },
  ],
};

const mockReportPending: ReportResponseDTO = {
  ...mockReport,
  id: 'demo-report-2',
  verificationStatus: 'pending',
  verificationCount: 0,
  disputeCount: 0,
  description: 'Small collection of glass bottles near the beach entrance.',
  litterType: 'glass',
  quantity: 'minimal',
  environmentalConcerns: [],
};

const mockReportDisputed: ReportResponseDTO = {
  ...mockReport,
  id: 'demo-report-3',
  verificationStatus: 'disputed',
  verificationCount: 2,
  disputeCount: 3,
  description: 'Hazardous waste containers found near the water.',
  litterType: 'hazardous',
  quantity: 'moderate',
};

export function ReportDetailDemo() {
  const [selectedReport, setSelectedReport] = useState<ReportResponseDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (report: ReportResponseDTO) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleVerify = (reportId: string) => {
    console.log('Verifying report:', reportId);
    alert(`Report ${reportId} verified!`);
    setIsModalOpen(false);
  };

  const handleDispute = (reportId: string) => {
    console.log('Disputing report:', reportId);
    alert(`Report ${reportId} disputed!`);
    setIsModalOpen(false);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Report Detail Modal Demo</h1>
          <p className="mt-2 text-gray-600">
            Click on any report card to view its details in the modal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Verified Report Card */}
          <button
            onClick={() => handleOpenModal(mockReport)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Verified
              </span>
              <span className="text-sm text-gray-500">5 verifications</span>
            </div>
            <img
              src={mockReport.photoUrls[0]}
              alt="Report preview"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="font-semibold text-gray-900 mb-2">Plastic Litter - Significant</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {mockReport.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Dublin Bay</span>
            </div>
          </button>

          {/* Pending Report Card */}
          <button
            onClick={() => handleOpenModal(mockReportPending)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                Pending
              </span>
              <span className="text-sm text-gray-500">0 verifications</span>
            </div>
            <img
              src={mockReportPending.photoUrls[0]}
              alt="Report preview"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="font-semibold text-gray-900 mb-2">Glass Litter - Minimal</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {mockReportPending.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Dublin Bay</span>
            </div>
          </button>

          {/* Disputed Report Card */}
          <button
            onClick={() => handleOpenModal(mockReportDisputed)}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                Disputed
              </span>
              <span className="text-sm text-gray-500">3 disputes</span>
            </div>
            <img
              src={mockReportDisputed.photoUrls[0]}
              alt="Report preview"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="font-semibold text-gray-900 mb-2">Hazardous Litter - Moderate</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {mockReportDisputed.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Dublin Bay</span>
            </div>
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">About This Demo</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Verified Report:</strong> Shows a report with multiple verifications and environmental concerns.
            </p>
            <p>
              <strong>Pending Report:</strong> Shows a newly submitted report awaiting community verification.
            </p>
            <p>
              <strong>Disputed Report:</strong> Shows a report that has received dispute flags from the community.
            </p>
            <p className="mt-4">
              Click any card to open the detailed modal view with photo gallery, verification actions, and full report information.
            </p>
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onVerify={handleVerify}
          onDispute={handleDispute}
        />
      )}
    </div>
  );
}

export default ReportDetailDemo;
