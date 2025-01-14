import { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { validateEmail } from '@/lib/validations';
import { CheckCircle2 } from 'lucide-react';

interface ChangeEmailModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  newEmail: string;
  confirmEmail: string;
  password: string;
}

interface FormErrors {
  newEmail?: string;
  confirmEmail?: string;
  password?: string;
  general?: string;
}

export function ChangeEmailModal({ open, onClose }: ChangeEmailModalProps) {
  const [formData, setFormData] = useState<FormData>({
    newEmail: '',
    confirmEmail: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.newEmail) {
      newErrors.newEmail = 'New email is required';
    } else if (!validateEmail(formData.newEmail)) {
      newErrors.newEmail = 'Invalid email format';
    }

    if (!formData.confirmEmail) {
      newErrors.confirmEmail = 'Please confirm your new email';
    } else if (formData.newEmail !== formData.confirmEmail) {
      newErrors.confirmEmail = 'Emails do not match';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isSubmitting || !auth.currentUser?.email) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // First, reauthenticate the user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        formData.password
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update email in Firebase Auth
      await updateEmail(auth.currentUser, formData.newEmail);

      // Update email in Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        email: formData.newEmail
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setFormData({
          newEmail: '',
          confirmEmail: '',
          password: '',
        });
      }, 2000);
    } catch (error: any) {
      console.error('Change email error:', error);
      
      let errorMessage = 'Failed to update email';
      
      if (error.code === 'auth/wrong-password') {
        setErrors({ password: 'Password is incorrect' });
      } else if (error.code === 'auth/email-already-in-use') {
        setErrors({ newEmail: 'This email is already in use' });
      } else if (error.code === 'auth/requires-recent-login') {
        setErrors({ general: 'Please sign in again before changing your email' });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onClose={onClose}>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center py-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Email Updated
            </h3>
            <p className="text-sm text-gray-500 text-center">
              Your email has been changed successfully. Remember to use your new email address when signing in.
            </p>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            Enter your new email address and current password
          </DialogDescription>
        </DialogHeader>

        {errors.general && (
          <div className="mt-4 bg-red-50 text-red-800 p-3 rounded-md text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
              New Email Address
            </label>
            <Input
              id="newEmail"
              name="newEmail"
              type="email"
              value={formData.newEmail}
              onChange={handleChange}
              error={errors.newEmail}
            />
          </div>

          <div>
            <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Email Address
            </label>
            <Input
              id="confirmEmail"
              name="confirmEmail"
              type="email"
              value={formData.confirmEmail}
              onChange={handleChange}
              error={errors.confirmEmail}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Email'}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}