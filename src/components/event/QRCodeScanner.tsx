import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScan: (userId: string) => void;
  onError?: (error: string) => void;
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerIdRef = useRef('qr-reader');

  // Detect if user is on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      
      // First, check if we can get camera devices (this will trigger permission prompt)
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          throw new Error('No camera found on this device.');
        }
      } catch (permErr: any) {
        // If we can't get cameras, it might be a permission issue
        console.error('Camera access error:', permErr);
      }

      const scanner = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.type === 'attendee-checkin' && data.userId) {
              onScan(data.userId);
            } else {
              const errorMsg = 'Invalid QR code format';
              setError(errorMsg);
              onError?.(errorMsg);
            }
          } catch (err) {
            const errorMsg = 'Failed to parse QR code';
            setError(errorMsg);
            onError?.(errorMsg);
          }
        },
        () => {
          // Ignore scanning errors (happens continuously while scanning)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      let errorMsg = 'Failed to start camera';
      
      console.error('Scanner error:', err);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('NotAllowedError')) {
        errorMsg = 'Camera permission denied. Please click "Allow" when your browser asks for camera access.';
      } else if (err.name === 'NotFoundError' || err.message?.includes('NotFoundError')) {
        errorMsg = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError' || err.message?.includes('NotReadableError')) {
        errorMsg = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError' || err.message?.includes('OverconstrainedError')) {
        errorMsg = 'Camera constraints not supported. Trying with default camera...';
        // Try again without facingMode constraint
        setTimeout(() => startScanningWithoutConstraints(), 1000);
        return;
      } else if (err.message?.includes('secure') || err.message?.includes('https')) {
        errorMsg = 'Camera access requires HTTPS. Use manual input instead.';
      } else if (err.message) {
        errorMsg = `Camera error: ${err.message}`;
      }
      
      setError(errorMsg);
      onError?.(errorMsg);
      setIsScanning(false);
      setShowManualInput(true); // Show manual input as fallback
    }
  };

  const startScanningWithoutConstraints = async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode(scannerIdRef.current);
      scannerRef.current = scanner;

      // Try with any available camera
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0 && devices[0]) {
        await scanner.start(
          devices[0].id, // Use first available camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              if (data.type === 'attendee-checkin' && data.userId) {
                onScan(data.userId);
              } else {
                const errorMsg = 'Invalid QR code format';
                setError(errorMsg);
                onError?.(errorMsg);
              }
            } catch (err) {
              const errorMsg = 'Failed to parse QR code';
              setError(errorMsg);
              onError?.(errorMsg);
            }
          },
          () => {
            // Ignore scanning errors
          }
        );
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error('Fallback scanner error:', err);
      setError('Unable to access camera. Please use manual check-in instead.');
      setShowManualInput(true);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    try {
      const data = JSON.parse(manualInput);
      if (data.type === 'attendee-checkin' && data.userId) {
        onScan(data.userId);
        setManualInput('');
        setShowManualInput(false);
      } else {
        setError('Invalid QR code data format');
      }
    } catch (err) {
      setError('Invalid JSON format. Please scan the QR code or paste valid data.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Info message before scanning */}
      {!isScanning && !error && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="font-medium mb-1">Camera Permission Required</p>
              <p>When you click "Start Camera Scan", your browser will ask for camera permission. Please click "Allow" to enable QR code scanning.</p>
            </div>
          </div>
        </div>
      )}

      <div
        id={scannerIdRef.current}
        className="w-full rounded-lg overflow-hidden bg-black"
        style={{ minHeight: isScanning ? '300px' : '0' }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">{error}</p>
          {error.includes('HTTPS') && (
            <p className="text-sm mt-2">
              💡 Tip: Camera access requires a secure connection (HTTPS) in most browsers. Use manual input below as an alternative.
            </p>
          )}
          {error.includes('permission') && (
            <p className="text-sm mt-2">
              💡 Tip: Check your browser's address bar for camera permission settings, or use manual input below.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {!isScanning ? (
          <>
            <button
              onClick={startScanning}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Start Camera Scan
            </button>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              {showManualInput ? 'Hide' : 'Manual Input'}
            </button>
          </>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Stop Scanning
          </button>
        )}
      </div>

      {isScanning && (
        <p className="text-sm text-gray-600 text-center">
          Position the QR code within the frame to scan
        </p>
      )}

      {/* Manual Input Form */}
      {showManualInput && !isScanning && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            Manual Check-In
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Paste the QR code data or enter the user's Clerk ID directly
          </p>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder='{"userId":"user_xxx","type":"attendee-checkin"}'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
              rows={3}
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Check In User
            </button>
          </form>
        </div>
      )}

      {/* Troubleshooting Button */}
      <button
        onClick={() => setShowTroubleshooting(!showTroubleshooting)}
        className="w-full text-sm text-gray-600 hover:text-gray-900 underline"
      >
        {showTroubleshooting ? '▼ Hide' : '▶'} Camera not working? Troubleshooting guide
      </button>

      {/* Troubleshooting Guide */}
      {showTroubleshooting && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Camera Troubleshooting
            </h3>
          </div>

          {/* iOS/iPhone Instructions */}
          {isIOS && (
            <div className="bg-white rounded-lg p-3 border border-amber-300">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                📱 iPhone/iPad Camera Permissions
              </h4>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Open your iPhone <strong>Settings</strong> app</li>
                <li>Scroll down and tap <strong>Safari</strong> (or <strong>Chrome</strong> if using Chrome)</li>
                <li>Tap <strong>Camera</strong></li>
                <li>Select <strong>"Ask"</strong> or <strong>"Allow"</strong></li>
                <li>Close Settings and return to this page</li>
                <li>Refresh the page and try scanning again</li>
              </ol>
              <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> If you previously denied camera access, you must change it in Settings. The browser won't ask again until you do.
                </p>
              </div>
            </div>
          )}

          {/* Safari-specific */}
          {isSafari && !isIOS && (
            <div className="bg-white rounded-lg p-3 border border-amber-300">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                🧭 Safari Camera Permissions
              </h4>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Click <strong>Safari</strong> in the menu bar</li>
                <li>Select <strong>Settings for This Website</strong></li>
                <li>Find <strong>Camera</strong> and set to <strong>"Allow"</strong></li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>
          )}

          {/* Chrome/General */}
          {!isSafari && (
            <div className="bg-white rounded-lg p-3 border border-amber-300">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                🌐 Chrome/Browser Camera Permissions
              </h4>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Look for a camera icon in your browser's address bar</li>
                <li>Click it and select <strong>"Allow"</strong></li>
                <li>Or click the lock/info icon next to the URL</li>
                <li>Find <strong>Camera</strong> permissions and set to <strong>"Allow"</strong></li>
                <li>Refresh the page and try scanning again</li>
              </ol>
            </div>
          )}

          {/* General Tips */}
          <div className="bg-white rounded-lg p-3 border border-amber-300">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Other Common Issues</h4>
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li><strong>Camera in use:</strong> Close other apps/tabs using your camera</li>
              <li><strong>No camera found:</strong> Make sure your device has a working camera</li>
              <li><strong>HTTPS required:</strong> Camera access only works on secure (https://) sites</li>
              <li><strong>Still not working?</strong> Use the "Manual Input" option or click "Check In" buttons in the attendee list below</li>
            </ul>
          </div>

          {/* Quick Alternative */}
          <div className="bg-green-50 rounded-lg p-3 border border-green-300">
            <h4 className="font-semibold text-green-900 mb-2">✅ Easy Alternative</h4>
            <p className="text-sm text-green-800">
              Skip the camera entirely! Just scroll down to the attendee list and click the <strong>"Check In"</strong> button next to each person's name.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
