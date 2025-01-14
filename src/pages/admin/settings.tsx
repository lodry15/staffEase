import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';
import { useAdminData } from '@/hooks/use-admin-data';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { HelpCircle, KeyRound, LogOut, Pencil } from 'lucide-react';
import { ChangePasswordModal } from '@/components/auth/change-password-modal';
import { ChangeEmailModal } from '@/components/auth/change-email-modal';

export function AdminSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { adminData, loading, error } = useAdminData(user);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            View your account information and manage settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Personal Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Full Name
                </label>
                <p className="text-base text-gray-900">
                  {adminData?.firstName} {adminData?.lastName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email Address
                </label>
                <div className="flex items-center justify-between">
                  <p className="text-base text-gray-900">{adminData?.email}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChangeEmail(true)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Role
                </label>
                <p className="text-base text-gray-900">Administrator</p>
              </div>
            </div>
          </div>

          {/* Account Actions Card */}
          <div className="space-y-6">
            {/* Help & Support Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Help & Support
              </h2>
              
              <div className="space-y-4">
                <button
                  className="w-full flex items-center px-4 py-2 text-left text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled
                >
                  <HelpCircle className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">Admin Documentation</p>
                    <p className="text-sm text-gray-500">
                      Access admin guides and documentation
                    </p>
                  </div>
                </button>

                <button
                  className="w-full flex items-center px-4 py-2 text-left text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  disabled
                >
                  <HelpCircle className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium">Technical Support</p>
                    <p className="text-sm text-gray-500">
                      Get technical assistance
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Account Actions Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Account Actions
              </h2>
              
              <div className="space-y-4">
                <Button
                  onClick={() => setShowChangePassword(true)}
                  variant="outline"
                  className="w-full justify-start text-gray-700 hover:text-gray-900"
                >
                  <KeyRound className="h-5 w-5 mr-3" />
                  Change Password
                </Button>

                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        <ChangePasswordModal
          open={showChangePassword}
          onClose={() => setShowChangePassword(false)}
        />

        <ChangeEmailModal
          open={showChangeEmail}
          onClose={() => setShowChangeEmail(false)}
        />
      </div>
    </AdminLayout>
  );
}