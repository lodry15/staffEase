import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';

export function Header() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-8">
      <div className="flex h-16 items-center justify-between">
        <div className="lg:hidden">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600 focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-x-4">
          <span className="text-sm text-gray-700">
            {user?.firstName} {user?.lastName}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}