import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Check, X, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { RequestDetailsModal } from '@/components/admin/request-details-modal';
import { RequestFilters } from '@/components/admin/request-filters';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast } from '@/components/ui/toast';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/auth';
import { useAdminRequests } from '@/hooks/use-admin-requests';
import { useToast } from '@/hooks/use-toast';
import { approveRequest, denyRequest } from '@/lib/db/request-actions';
import { prepareRequestsForExport } from '@/lib/utils/export-requests';
import { exportToCSV } from '@/lib/utils/csv-export';
import { cn } from '@/lib/utils';

const requestTypeLabels = {
  days_off: 'Days Off',
  hours_off: 'Hours Off',
  sick_leave: 'Sick Leave',
};

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  approved: 'bg-green-50 text-green-700',
  denied: 'bg-red-50 text-red-700',
};

type SortField = 'createdAt' | 'startDate' | 'type' | 'daysOff' | 'hoursOff' | 'status';
type SortDirection = 'asc' | 'desc';

export function TimeOffRequestsPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    location: '',
    startDate: '',
    endDate: '',
  });
  const { requests, loading, error } = useAdminRequests(filters);
  const { toasts, addToast, removeToast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approve' | 'deny';
    requestId: string | null;
  }>({
    open: false,
    type: 'approve',
    requestId: null,
  });
  const [processing, setProcessing] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getTimestamp = (obj: any) => {
    if (!obj) return 0;
    return obj.seconds ? obj.seconds : 0;
  };

  const sortRequests = (a: any, b: any) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'createdAt':
      case 'startDate':
        return (getTimestamp(a[sortField]) - getTimestamp(b[sortField])) * direction;
      case 'type':
        return (a.type || '').localeCompare(b.type || '') * direction;
      case 'daysOff':
        const aDays = a.type === 'hours_off' ? 0 : (a.daysOff || 0);
        const bDays = b.type === 'hours_off' ? 0 : (b.daysOff || 0);
        return (aDays - bDays) * direction;
      case 'hoursOff':
        const aHours = a.type === 'hours_off' ? (a.hoursOff || 0) : 0;
        const bHours = b.type === 'hours_off' ? (b.hoursOff || 0) : 0;
        return (aHours - bHours) * direction;
      case 'status':
        return (a.status || '').localeCompare(b.status || '') * direction;
      default:
        return 0;
    }
  };

  const handleExport = async () => {
    if (!user?.organizationId) return;

    try {
      const data = await prepareRequestsForExport(user.organizationId, filters);
      const filename = `time-off-requests-${format(new Date(), 'yyyy-MM-dd')}`;
      exportToCSV(data, filename);
      addToast('Data exported successfully', 'success');
    } catch (error: any) {
      console.error('Export error:', error);
      addToast(
        error.message === 'Export limit exceeded: Maximum 1,000 rows allowed'
          ? error.message
          : 'Failed to export data',
        'error'
      );
    }
  };

  const handleAction = (type: 'approve' | 'deny', requestId: string) => {
    setConfirmDialog({
      open: true,
      type,
      requestId,
    });
  };

  const handleConfirmAction = async () => {
    if (!user?.id || !confirmDialog.requestId) return;

    setProcessing(true);
    try {
      if (confirmDialog.type === 'approve') {
        await approveRequest({
          requestId: confirmDialog.requestId,
          adminId: user.id,
        });
        addToast('Request approved successfully', 'success');
      } else {
        await denyRequest({
          requestId: confirmDialog.requestId,
          adminId: user.id,
        });
        addToast('Request denied successfully', 'success');
      }
    } catch (err) {
      console.error('Error processing request:', err);
      addToast('Failed to process request', 'error');
    } finally {
      setProcessing(false);
      setConfirmDialog({ open: false, type: 'approve', requestId: null });
    }
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon field={field} />
      </div>
    </TableHead>
  );

  const sortedRequests = [...(requests || [])].sort(sortRequests);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Time-Off Requests</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage employee time-off requests
            </p>
          </div>
          
          <Button
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center transition-transform duration-200 hover:scale-105"
            disabled={loading || !!error}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        <RequestFilters onFilterChange={setFilters} />

        {error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading requests...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader field="createdAt">Created</SortableHeader>
                  <TableHead>Employee</TableHead>
                  <TableHead>Location</TableHead>
                  <SortableHeader field="type">Type</SortableHeader>
                  <SortableHeader field="startDate">Start</SortableHeader>
                  <SortableHeader field="daysOff">Days Off</SortableHeader>
                  <SortableHeader field="hoursOff">Hours Off</SortableHeader>
                  <SortableHeader field="status">Status</SortableHeader>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-sm">
                      {format(new Date(request.createdAt.seconds * 1000), 'MMM d')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.employeeName}
                    </TableCell>
                    <TableCell>{request.locationName}</TableCell>
                    <TableCell>
                      {requestTypeLabels[request.type as keyof typeof requestTypeLabels]}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.startDate.seconds * 1000), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-center">
                      {request.type === 'hours_off' ? '0' : (request.daysOff || '0')}
                    </TableCell>
                    <TableCell className="text-center">
                      {request.type === 'hours_off' ? (request.hoursOff || '0') : '0'}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex px-2 py-1 rounded-md text-xs font-medium',
                        statusStyles[request.status as keyof typeof statusStyles]
                      )}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center space-x-1">
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction('approve', request.id)}
                            className="hover:bg-green-50 transition-colors duration-200"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction('deny', request.id)}
                            className="hover:bg-red-50 transition-colors duration-200"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction('deny', request.id)}
                          className="hover:bg-red-50 transition-colors duration-200"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                        className="hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sortedRequests.length === 0 && (
                  <TableRow>
                    <TableCell 
                      colSpan={9} 
                      className="text-center text-gray-500 py-8"
                    >
                      No requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <RequestDetailsModal
          open={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />

        <ConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ open: false, type: 'approve', requestId: null })}
          onConfirm={handleConfirmAction}
          title={`${confirmDialog.type === 'approve' ? 'Approve' : 'Deny'} Request`}
          message={`Are you sure you want to ${confirmDialog.type} this request?`}
          confirmText={confirmDialog.type === 'approve' ? 'Approve' : 'Deny'}
          isDestructive={confirmDialog.type === 'deny'}
          loading={processing}
        />

        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </AdminLayout>
  );
}