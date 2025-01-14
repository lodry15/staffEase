import { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import { EmployeeLayout } from '@/components/layouts/employee-layout';
import { Button } from '@/components/ui/button';
import { RequestForm } from '@/components/time-off/request-form';
import { RequestDetailsModal } from '@/components/time-off/request-details-modal';
import { RequestFilters } from '@/components/time-off/request-filters';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/auth';
import { useTimeOffRequests } from '@/hooks/use-time-off-requests';
import { createRequest } from '@/lib/db/requests';
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

export function EmployeeTimeOffRequestsPage() {
  const { user } = useAuthStore();
  const { requests, loading, error } = useTimeOffRequests(user?.id);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const filteredRequests = (requests || [])
    .filter(request => {
      if (!request) return false;
      if (typeFilter && request.type !== typeFilter) return false;
      if (statusFilter && request.status !== statusFilter) return false;
      
      if (dateFilter && request.startDate) {
        try {
          const requestDate = new Date(request.startDate.seconds * 1000);
          const filterMonth = dateFilter.substring(0, 7); // Get YYYY-MM from date string
          const requestMonth = format(requestDate, 'yyyy-MM');
          if (requestMonth !== filterMonth) {
            return false;
          }
        } catch (err) {
          console.error('Error filtering by date:', err);
          return false;
        }
      }
      
      return true;
    })
    .sort(sortRequests);

  const handleRequestSubmit = async (data: any) => {
    if (!user?.id) return;
    await createRequest(user.id, data);
    setIsRequestModalOpen(false);
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

  return (
    <EmployeeLayout>
      {/* Main container */}
      <div className="space-y-4">
        {/* Top container with mobile margins */}
        <div className="mx-[5px] sm:mx-0">
          {/* Fixed width content area - Left aligned with dynamic mobile width */}
          <div className="w-full min-[320px]:max-w-[310px] min-[375px]:max-w-[365px] min-[425px]:max-w-[415px] min-[480px]:max-w-[470px] sm:max-w-none">
            {/* Header and button container */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              {/* Header */}
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Time-Off Requests</h1>
                <p className="mt-1 text-sm text-gray-600">
                  View and manage your time-off requests
                </p>
              </div>

              {/* Button - Full width on mobile, auto width on tablet/desktop */}
              <div className="w-full sm:w-auto sm:flex-shrink-0">
                <Button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center text-sm whitespace-nowrap"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Send a New Request
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4">
              <RequestFilters
                typeFilter={typeFilter}
                statusFilter={statusFilter}
                dateFilter={dateFilter}
                onTypeFilterChange={setTypeFilter}
                onStatusFilterChange={setStatusFilter}
                onDateFilterChange={setDateFilter}
              />
            </div>
          </div>
        </div>

        {/* Table container with same margins */}
        <div className="mx-[5px] sm:mx-0">
          <div className="w-full min-[320px]:max-w-[310px] min-[375px]:max-w-[365px] min-[425px]:max-w-[415px] min-[480px]:max-w-[470px] sm:max-w-none">
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHeader field="createdAt">Created</SortableHeader>
                        <SortableHeader field="type">Type</SortableHeader>
                        <SortableHeader field="startDate">Start</SortableHeader>
                        <SortableHeader field="daysOff">Days Off</SortableHeader>
                        <SortableHeader field="hoursOff">Hours Off</SortableHeader>
                        <SortableHeader field="status">Status</SortableHeader>
                        <TableHead className="text-right">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {request.createdAt ? format(new Date(request.createdAt.seconds * 1000), 'MMM d') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {requestTypeLabels[request.type as keyof typeof requestTypeLabels]}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {request.startDate ? format(new Date(request.startDate.seconds * 1000), 'MMM d') : 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {request.type === 'hours_off' ? '0' : (request.daysOff || '0')}
                          </TableCell>
                          <TableCell className="text-xs">
                            {request.type === 'hours_off' ? (request.hoursOff || '0') : '0'}
                          </TableCell>
                          <TableCell>
                            <span className={cn(
                              'inline-flex px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                              statusStyles[request.status as keyof typeof statusStyles]
                            )}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                              className="hover:bg-gray-100 p-1"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-8 text-sm">
                            No requests found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <RequestForm
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleRequestSubmit}
        daysAvailable={user?.daysAvailable || 0}
        hoursAvailable={user?.hoursAvailable || 0}
      />

      <RequestDetailsModal
        open={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </EmployeeLayout>
  );
}