import { useState } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../auth/UserProfile';
import { NotificationBell } from '../common/NotificationBell';

/**
 * Application header with navigation and authentication controls
 * Responsive design with mobile hamburger menu
 */
export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                Litter Scouts
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <SignedIn>
              <Link
                to="/map"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Map
              </Link>
              <Link
                to="/reports/new"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Report
              </Link>
              <Link
                to="/events"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Events
              </Link>
              <Link
                to="/analytics"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Analytics
              </Link>
              <NotificationBell />
              <UserProfile />
            </SignedIn>

            <SignedOut>
              <Link
                to="/map"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                View Map
              </Link>
              <SignInButton mode="modal">
                <button className="px-3 lg:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle navigation menu"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            {isMobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <SignedIn>
                <Link
                  to="/map"
                  onClick={closeMobileMenu}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  style={{ minHeight: '44px' }}
                >
                  Map
                </Link>
                <Link
                  to="/reports/new"
                  onClick={closeMobileMenu}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  style={{ minHeight: '44px' }}
                >
                  Report Litter
                </Link>
                <Link
                  to="/events"
                  onClick={closeMobileMenu}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  style={{ minHeight: '44px' }}
                >
                  Events
                </Link>
                <Link
                  to="/analytics"
                  onClick={closeMobileMenu}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  style={{ minHeight: '44px' }}
                >
                  Analytics
                </Link>
                <div className="px-3 py-2">
                  <UserProfile />
                </div>
              </SignedIn>

              <SignedOut>
                <Link
                  to="/map"
                  onClick={closeMobileMenu}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  style={{ minHeight: '44px' }}
                >
                  View Map
                </Link>
                <div className="px-3 py-2 space-y-2">
                  <SignInButton mode="modal">
                    <button 
                      className="w-full px-4 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      style={{ minHeight: '44px' }}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button 
                      className="w-full px-4 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      style={{ minHeight: '44px' }}
                    >
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
