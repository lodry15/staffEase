import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CheckCircle2, Check } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { validateRequestDates } from '@/lib/utils/request-validation';
import { cn } from '@/lib/utils';

interface RequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  daysAvailable?: number;
  hoursAvailable?: number;
  initialData?: {
    type: 'days_off' | 'hours_off' | 'sick_leave';
    startDate: string;
    endDate?: string;
    hours?: string;
    notes?: string;
  };
  isEditing?: boolean;
}

export function RequestForm({ 
  open, 
  onClose, 
  onSubmit,
  daysAvailable = 0,
  hoursAvailable = 0,
  initialData,
  isEditing = false
}: RequestFormProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    type: 'days_off',
    startDate: '',
    endDate: '',
    hours: '',
    notes: '',
    certificate: null as File | null,
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        startDate: initialData.startDate,
        endDate: initialData.endDate || '',
        hours: initialData.hours || '',
        notes: initialData.notes || '',
        certificate: null,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, certificate: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setErrors({});
    setIsSubmitting(true);

    try {
      // Validate dates for overlapping requests
      const validation = await validateRequestDates({
        startDate: formData.startDate,
        endDate: formData.endDate || formData.startDate,
        userId: user.id,
        requestId: isEditing ? initialData?.id : undefined
      });

      if (!validation.isValid) {
        setErrors({ dates: validation.error || 'Invalid date range' });
        setIsSubmitting(false);
        return;
      }

      await onSubmit(formData);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        if (!isEditing) {
          setFormData({
            type: 'days_off',
            startDate: '',
            endDate: '',
            hours: '',
            notes: '',
            certificate: null,
          });
        }
      }, 1500);
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to submit request' });
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
              {isEditing ? 'Request Updated' : 'Request Submitted'}
            </h3>
            <p className="text-sm text-gray-500">
              {isEditing 
                ? 'Your request has been updated successfully'
                : 'Your time-off request has been sent successfully'}
            </p>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Request' : 'New Time-Off Request'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your request details' : 'Submit a new request for time off'}
          </DialogDescription>
        </DialogHeader>

        {errors.submit && (
          <div className="mt-4 bg-red-50 text-red-800 p-3 rounded-md text-sm">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Request Type
            </label>
            <Select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full"
            >
              <option value="days_off">Days Off</option>
              <option value="hours_off">Hours Off</option>
              <option value="sick_leave">Sick Leave</option>
            </Select>
          </div>

          {(formData.type === 'days_off' || formData.type === 'sick_leave') && (
            <>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate}
                  required
                />
              </div>
            </>
          )}

          {formData.type === 'hours_off' && (
            <>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Requested
                </label>
                <Input
                  type="number"
                  id="hours"
                  name="hours"
                  value={formData.hours}
                  onChange={handleChange}
                  min="1"
                  max="8"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Maximum 8 hours per day</p>
              </div>
            </>
          )}

          {formData.type === 'sick_leave' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical Certificate (Optional)
              </label>
              <div className="mt-1 flex items-center">
                <label
                  htmlFor="certificate"
                  className={cn(
                    "flex items-center justify-center px-4 py-2 rounded-md border border-gray-300",
                    "bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-200",
                    "text-sm font-medium text-gray-700"
                  )}
                >
                  {formData.certificate ? (
                    <span className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      File selected
                    </span>
                  ) : (
                    "Choose file"
                  )}
                </label>
                <input
                  id="certificate"
                  name="certificate"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-4"
              placeholder="Add any additional information..."
            />
          </div>

          {errors.dates && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              {errors.dates}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full h-12 sm:h-10 sm:w-[120px] text-base sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 sm:h-10 sm:w-[120px] text-base sm:text-sm"
            >
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Submitting...') 
                : (isEditing ? 'Update Request' : 'Submit Request')}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}