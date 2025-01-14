import { useState, useEffect } from 'react';
import { format, isBefore, startOfToday } from 'date-fns';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { deleteRequest, updateRequest } from '@/lib/db/requests';
import { RequestForm } from './request-form';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RequestDetailsModalProps {
  open: boolean;
  onClose: () => void;
  request: any;
}

const requestTypeLabels = {
  days_off: 'Days Off',
  hours_off: 'Hours Off',
  sick_leave: 'Sick Leave',
};

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  denied: 'bg-red-50 text-red-700 border-red-200',
};

export function RequestDetailsModal({ open, onClose, request: initialRequest }: RequestDetailsModalProps) {
  const [request, setRequest] = useState(initialRequest);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates for the request
  useEffect(() => {
    if (!initialRequest?.id) return;

    const requestRef = doc(db, 'requests', initialRequest.id);
    const unsubscribe = onSnapshot(
      requestRef,
      (doc) => {
        if (doc.exists()) {
          setRequest({
            id: doc.id,
            ...doc.data()
          });
        }
      },
      (error) => {
        console.error('Error listening to request updates:', error);
        setError('Failed to get latest request data');
      }
    );

    return () => unsubscribe();
  }, [initialRequest?.id]);

  if (!request) return null;

  const formatDate = (timestamp: { seconds: number }) => {
    return format(new Date(timestamp.seconds * 1000), 'MMM d, yyyy');
  };

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleEditSubmit = async (data: any) => {
    try {
      await updateRequest(request.id, data);
      setShowEditForm(false);
    } catch (err) {
      setError('Failed to update request. Please try again.');
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteRequest(request.id);
      onClose();
    } catch (err) {
      setError('Failed to delete request. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Check if request is in the past
  const isRequestInPast = isBefore(
    new Date(request.startDate.seconds * 1000),
    startOfToday()
  );

  // Show buttons only if:
  // 1. Request is not denied AND
  // 2. Either:
  //    - Request is pending (regardless of date) OR
  //    - Request is approved but not in the past
  const showButtons = request.status !== 'denied' && 
    (request.status === 'pending' || (request.status === 'approved' && !isRequestInPast));

  if (showEditForm) {
    return (
      <RequestForm
        open={open}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleEditSubmit}
        initialData={{
          type: request.type,
          startDate: format(new Date(request.startDate.seconds * 1000), 'yyyy-MM-dd'),
          endDate: request.endDate ? format(new Date(request.endDate.seconds * 1000), 'yyyy-MM-dd') : undefined,
          hours: request.hoursOff?.toString(),
          notes: request.notes,
        }}
        isEditing={true}
      />
    );
  }

  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onClose={() => setShowDeleteConfirm(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-bounce">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-center mb-2">Delete Request</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Are you sure you want to delete this request? This action cannot be undone.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 text-red-800 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Created Date</p>
              <p className="mt-1 text-base text-gray-900">
                {formatDate(request.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <p className="mt-1 text-base text-gray-900">
                {requestTypeLabels[request.type as keyof typeof requestTypeLabels]}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="mt-1 text-base text-gray-900">
                {formatDate(request.startDate)}
              </p>
            </div>

            {request.endDate && (
              <div>
                <p className="text-sm font-medium text-gray-500">End Date</p>
                <p className="mt-1 text-base text-gray-900">
                  {formatDate(request.endDate)}
                </p>
              </div>
            )}

            {request.daysOff > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Days Off</p>
                <p className="mt-1 text-base text-gray-900">{request.daysOff}</p>
              </div>
            )}

            {request.hoursOff > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Hours Off</p>
                <p className="mt-1 text-base text-gray-900">{request.hoursOff}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Status</p>
            <p className={`mt-1 text-sm inline-flex px-2 py-1 rounded-md border ${
              statusStyles[request.status as keyof typeof statusStyles]
            }`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </p>
          </div>

          {request.notes && (
            <div>
              <p className="text-sm font-medium text-gray-500">Notes</p>
              <p className="mt-1 text-base text-gray-900 bg-gray-50 p-4 rounded-md">
                {request.notes}
              </p>
            </div>
          )}

          {request.adminComments && (
            <div>
              <p className="text-sm font-medium text-gray-500">Admin Comments</p>
              <p className="mt-1 text-base text-gray-900 bg-gray-50 p-4 rounded-md">
                {request.adminComments}
              </p>
            </div>
          )}
        </div>

        {showButtons && (
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              onClick={handleEdit}
              variant="outline"
              className="flex items-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-colors duration-200"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-colors duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}