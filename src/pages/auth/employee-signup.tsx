import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, deleteField } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { validateEmail } from '@/lib/validations';

interface FormData {
  email: string;
  temporaryPassword: string;
}

interface FormErrors {
  email?: string;
  temporaryPassword?: string;
  general?: string;
}

export function EmployeeSignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    temporaryPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.temporaryPassword) {
      newErrors.temporaryPassword = 'Temporary password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isLoading) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Sign out any existing user first
      await signOut(auth);

      // Find the user document first
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('email', '==', formData.email.toLowerCase()),
        where('systemRole', 'array-contains', 'employee')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('No employee account found with this email');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (!userData.temporaryPassword) {
        throw new Error('Account already activated');
      }

      if (userData.temporaryPassword !== formData.temporaryPassword) {
        throw new Error('Invalid temporary password');
      }

      // Try to sign in with the provided credentials
      await signInWithEmailAndPassword(
        auth,
        formData.email.toLowerCase(),
        formData.temporaryPassword
      );

      // Remove temporary password from Firestore
      await updateDoc(doc(db, 'users', userDoc.id), {
        temporaryPassword: deleteField()
      });

      // Redirect to change password page
      navigate('/change-password', { 
        state: { 
          isFirstLogin: true,
          email: formData.email 
        } 
      });
    } catch (error: any) {
      console.error('Employee signup error:', error);
      
      let errorMessage = 'Invalid email or temporary password';
      
      if (error.message === 'No employee account found with this email') {
        errorMessage = 'No employee account found with this email';
      } else if (error.message === 'Account already activated') {
        errorMessage = 'This account has already been activated. Please use the login page.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
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
          <h1 className="text-2xl font-bold text-gray-900">Employee Sign Up</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and temporary password to get started
          </p>
        </div>

        {errors.general && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="temporaryPassword" className="block text-sm font-medium text-gray-700">
              Temporary Password
            </label>
            <PasswordInput
              id="temporaryPassword"
              name="temporaryPassword"
              value={formData.temporaryPassword}
              onChange={handleChange}
              error={errors.temporaryPassword}
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing up...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}