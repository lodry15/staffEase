import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Calendar,
  Settings
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/employee', icon: LayoutDashboard },
  { name: 'Time-Off Requests', href: '/employee/time-off-requests', icon: Calendar },
];

const bottomNavigation = [
  { name: 'Settings', href: '/employee/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-72 bg-gradient-to-b from-[#9F6EFF] via-[#8B55F6] to-[#7B3FE4] text-white">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-2xl font-bold">StaffEase</h1>
      </div>
      
      <div className="flex-1 flex flex-col justify-between px-4 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <nav className="space-y-1">
          {bottomNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}