import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

export function PrintableQRCodePage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Add print-specific styles
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-qr-code, #printable-qr-code * {
          visibility: visible;
        }
        #printable-qr-code {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your QR code</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const qrData = JSON.stringify({
    userId: user.id,
    type: 'attendee-checkin',
    timestamp: Date.now(),
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Action Buttons - Hidden when printing */}
      <div className="max-w-4xl mx-auto mb-6 no-print">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 inline-flex items-center"
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center"
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
      </div>

      {/* Printable Content */}
      <div id="printable-qr-code" className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Event Check-In QR Code
            </h1>
            <p className="text-sm text-gray-600">
              Litter Scouts - Beach Cleanup Events
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white border-4 border-gray-200 rounded-lg">
              <QRCodeSVG
                value={qrData}
                size={240}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center mb-2">
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || user.username || 'User'}
                  className="w-12 h-12 rounded-full border-2 border-gray-300"
                />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-0.5">
              {user.fullName || user.username || 'User'}
            </h2>
            <p className="text-sm text-gray-600">@{user.username}</p>
          </div>

          {/* Instructions */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-base font-semibold text-gray-900 mb-2 text-center">
              How to Use
            </h3>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs mr-2 flex-shrink-0 mt-0.5">
                  1
                </span>
                <p>Bring this QR code to any Litter Scouts cleanup event</p>
              </div>
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs mr-2 flex-shrink-0 mt-0.5">
                  2
                </span>
                <p>Show it to the event organizer for quick check-in</p>
              </div>
              <div className="flex items-start">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 font-semibold text-xs mr-2 flex-shrink-0 mt-0.5">
                  3
                </span>
                <p>Your attendance will be automatically recorded</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>This QR code is unique to your account - Keep it safe and don't share with others</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintableQRCodePage;
