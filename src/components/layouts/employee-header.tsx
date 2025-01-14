import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        <div className="lg:hidden">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onClick={onMenuClick}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <span className="hidden sm:block text-sm text-gray-700">
            {user?.firstName} {user?.lastName}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="min-w-[90px]"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}