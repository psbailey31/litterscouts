import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useEffect, lazy, Suspense, Component } from 'react';
import type { ReactNode } from 'react';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Toast notifications
import { ToastProvider } from './components/common/Toast';

// Layout
import { Layout } from './components/layout';

// Auth components
import { ProtectedRoute, SignInPage, SignUpPage } from './components/auth';

// Lazy load pages
const HomePage = lazy(() => import('./pages/HomePage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const ReportFormPage = lazy(() => import('./pages/ReportFormPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const WhyCleanPage = lazy(() => import('./pages/WhyCleanPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const EventCheckInPage = lazy(() => import('./pages/EventCheckInPage'));
const PrintableQRCodePage = lazy(() => import('./pages/PrintableQRCodePage'));

// Services
import { apiClient } from './services/api';
import { reportService } from './services/reportService';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

// Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-4">An unexpected error occurred.</p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 404 page
function NotFound() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-6">Page not found</p>
          <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}

function ApiInitializer({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    const tokenGetter = () => getToken();
    apiClient.setTokenGetter(tokenGetter);
    reportService.setTokenGetter(tokenGetter);
  }, [getToken]);

  return <>{children}</>;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" aria-hidden="true"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={clerkPubKey}
        afterSignOutUrl="/"
      >
        <QueryClientProvider client={queryClient}>
          <ApiInitializer>
            <BrowserRouter>
            <ToastProvider>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/sign-in/*" element={<SignInPage />} />
                  <Route path="/sign-up/*" element={<SignUpPage />} />

                  <Route path="/" element={<Layout><HomePage /></Layout>} />
                  <Route path="/map" element={<Layout><MapPage /></Layout>} />
                  <Route path="/why-clean" element={<Layout><WhyCleanPage /></Layout>} />

                  {/* Protected routes */}
                  <Route path="/reports/new" element={<ProtectedRoute><Layout><ReportFormPage /></Layout></ProtectedRoute>} />
                  <Route path="/events" element={<ProtectedRoute><Layout><EventsPage /></Layout></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Layout><AnalyticsPage /></Layout></ProtectedRoute>} />
                  <Route path="/profile/:userId" element={<ProtectedRoute><Layout><UserProfilePage /></Layout></ProtectedRoute>} />
                  <Route path="/events/:eventId/checkin" element={<ProtectedRoute><Layout><EventCheckInPage /></Layout></ProtectedRoute>} />
                  <Route path="/qr-code/print" element={<ProtectedRoute><PrintableQRCodePage /></ProtectedRoute>} />

                  {/* 404 catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ToastProvider>
            </BrowserRouter>
          </ApiInitializer>
        </QueryClientProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default App;
