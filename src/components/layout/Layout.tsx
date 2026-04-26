import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <a href="#main-content" className="absolute -top-full focus:top-0 left-0 z-50 p-4 bg-blue-600 text-white focus:outline-none">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="flex-1">{children}</main>
      <footer className="bg-gray-800 text-gray-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-2">LitterScouts</h3>
              <p className="text-sm">Community-powered coastal cleanup and environmental monitoring for Ireland.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Quick Links</h3>
              <ul className="text-sm space-y-1">
                <li><a href="/map" className="hover:text-white transition-colors">Litter Map</a></li>
                <li><a href="/events" className="hover:text-white transition-colors">Cleanup Events</a></li>
                <li><a href="/why-clean" className="hover:text-white transition-colors">Why Clean Up?</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Contact</h3>
              <p className="text-sm">Questions or feedback?</p>
              <button
                onClick={() => window.location.href = ['ma','ilto:','hello','@litter','scouts.ps','bailey.uk'].join('')}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                hello&#64;litterscouts&#46;psbailey&#46;uk
              </button>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-4 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} LitterScouts. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
