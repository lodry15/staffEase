import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { validatePassword } from '@/lib/validations';

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

interface LocationState {
  isFirstLogin?: boolean;
  email?: string;
}

export function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isFirstLogin, email } = (location.state as LocationState) || {};

  const [formData, setFormData] = useState<FormData>({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Ensure user is authenticated
    if (!auth.currentUser) {
      navigate('/login');
    }
  }, [navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const passwordErrors = validatePassword(formData.newPassword);

    if (passwordErrors.length > 0) {
      newErrors.newPassword = passwordErrors[0];
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isLoading || !auth.currentUser) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await updatePassword(auth.currentUser, formData.newPassword);
      
      // Redirect based on user type
      if (isFirstLogin) {
        navigate('/employee');
      } else {
        navigate(-1);
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      
      let errorMessage = 'Failed to update password';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign in again before changing your password';
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isFirstLogin ? 'Set Your Password' : 'Change Password'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isFirstLogin 
              ? 'Create a new password for your account'
              : 'Enter your new password below'}
          </p>
        </div>

        {errors.general && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}