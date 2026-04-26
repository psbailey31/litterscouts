import { QRCodeSVG } from 'qrcode.react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export function UserQRCode() {
  const { user } = useUser();
  const navigate = useNavigate();

  if (!user) return null;

  // Generate QR code data with user ID
  const qrData = JSON.stringify({
    userId: user.id,
    type: 'attendee-checkin',
    timestamp: Date.now(),
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Your Check-in QR Code
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Show this QR code to event organizers to check in at events
      </p>
      <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
        <QRCodeSVG
          value={qrData}
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">
        {user.username || user.firstName || 'User'}
      </p>
      <button
        onClick={() => navigate('/qr-code/print')}
        className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        Print QR Code
      </button>
    </div>
  );
}
