import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layouts/employee-sidebar';
import { Header } from '@/components/layouts/employee-header';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Calendar,
  Settings,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/employee', icon: LayoutDashboard },
  { name: 'Time-Off Requests', href: '/employee/time-off-requests', icon: Calendar },
];

const bottomNavigation = [
  { name: 'Settings', href: '/employee/settings', icon: Settings },
];

interface EmployeeLayoutProps {
  children: React.ReactNode;
}

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Mobile sidebar */}
        <div
          className={cn(
            "fixed inset-0 z-40 lg:hidden",
            isSidebarOpen ? "block" : "hidden"
          )}
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Mobile menu */}
          <div className="fixed inset-y-0 left-0 flex w-[80%] max-w-sm flex-col bg-gradient-to-b from-[#9F6EFF] via-[#8B55F6] to-[#7B3FE4]">
            <div className="absolute top-1 right-1 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex-shrink-0 px-6 pt-6">
              <h1 className="text-2xl font-bold text-white">StaffEase</h1>
            </div>

            <div className="mt-8 flex-1 flex flex-col justify-between">
              <nav className="px-6 space-y-6">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'group flex items-center px-4 py-3 text-base font-medium rounded-md',
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <Icon className="mr-4 h-6 w-6 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <nav className="px-6 pb-6">
                {bottomNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        'group flex items-center px-4 py-3 text-base font-medium rounded-md',
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <Icon className="mr-4 h-6 w-6 flex-shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex w-72">
            <Sidebar />
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}