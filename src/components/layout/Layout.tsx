
import { ReactNode } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-gray-50 border-t border-gray-100 py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-ajo-primary to-ajo-secondary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="ml-2 font-bold">VoxCard</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Blockchain-Powered Ajo Platform</p>
            </div>
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} VoxCard. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
