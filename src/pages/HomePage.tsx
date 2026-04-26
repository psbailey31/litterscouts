import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

/**
 * Home page with welcome message and call-to-action
 */
export function HomePage() {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: 'url(/hero.webp), url(/hero.jpg)' }}
    >
      {/* Full page overlay for better text readability */}
      <div className="min-h-screen bg-black/40">
        
        {/* Hero Section */}
        <div className="relative z-10 max-w-7xl mx-auto py-12 sm:py-16 md:py-24 px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white drop-shadow-lg leading-tight">
            Track and Clean Ireland's Beaches
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-white max-w-3xl mx-auto drop-shadow-md px-2">
            Join our community in mapping beach litter, organizing clean-up events, 
            and protecting our coastal environment through data-driven action.
          </p>

          <SignedOut>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4">
              <Link
                to="/sign-up"
                className="px-6 py-3 sm:px-8 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 md:py-4 md:text-lg md:px-10 shadow-lg transition-all hover:scale-105 touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                Get Started
              </Link>
              <Link
                to="/map"
                className="px-6 py-3 sm:px-8 border-2 border-white text-base font-medium rounded-md text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/30 md:py-4 md:text-lg md:px-10 shadow-lg transition-all hover:scale-105 touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                View Map
              </Link>
              <Link
                to="/why-clean"
                className="px-6 py-3 sm:px-8 border-2 border-white text-base font-medium rounded-md text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/30 md:py-4 md:text-lg md:px-10 shadow-lg transition-all hover:scale-105 touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                Why Clean Our Beaches?
              </Link>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4">
              <Link
                to="/reports/new"
                className="px-6 py-3 sm:px-8 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 md:py-4 md:text-lg md:px-10 shadow-lg transition-all hover:scale-105 touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                Report Litter
              </Link>
              <Link
                to="/map"
                className="px-6 py-3 sm:px-8 border-2 border-white text-base font-medium rounded-md text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/30 md:py-4 md:text-lg md:px-10 shadow-lg transition-all hover:scale-105 touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                View Map
              </Link>
              <Link
                to="/why-clean"
                className="px-6 py-3 sm:px-8 border-2 border-white text-base font-medium rounded-md text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 active:bg-white/30 md:py-4 md:text-lg md:px-10 shadow-lg transition-all hover:scale-105 touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                Why Clean Our Beaches?
              </Link>
            </div>
          </SignedIn>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            <div className="bg-white/95 backdrop-blur-sm p-5 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-blue-600 text-3xl sm:text-4xl mb-3 sm:mb-4">📍</div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Report Litter
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Document beach litter with photos and location data to raise awareness 
                and track pollution patterns.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-5 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-blue-600 text-3xl sm:text-4xl mb-3 sm:mb-4">🗺️</div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Interactive Maps
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Visualize litter hotspots, view reports from your area, and identify 
                areas that need attention.
              </p>
            </div>

            <div className="bg-white/95 backdrop-blur-sm p-5 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-blue-600 text-3xl sm:text-4xl mb-3 sm:mb-4">🤝</div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Organize Events
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Create and join clean-up events, coordinate with volunteers, and make 
                a real impact on coastal health.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
