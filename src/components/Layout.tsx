import { NavLink, Outlet } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">TMF637 Product Inventory</span>
          </div>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              Products
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
