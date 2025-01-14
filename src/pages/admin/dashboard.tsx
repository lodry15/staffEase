import { AdminLayout } from '@/components/layouts/admin-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { AvailabilityChart } from '@/components/dashboard/availability-chart';
import { ShortageTable } from '@/components/dashboard/shortage-table';
import { Users, Clock, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminRequestStats } from '@/hooks/use-admin-request-stats';
import { useEmployeeStats } from '@/hooks/use-employee-stats';
import { useAvailableStaff } from '@/hooks/use-available-staff';
import { useAuthStore } from '@/store/auth';
import { useEffect, useState } from 'react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const { pendingCount, loading: requestsLoading, error: requestsError } = useAdminRequestStats();
  const { totalCount, loading: employeesLoading, error: employeesError } = useEmployeeStats();
  const { availableStaff, totalEmployees, loading: staffLoading, error: staffError } = useAvailableStaff();

  useEffect(() => {
    // Ensure user is loaded and has required data
    if (!user) {
      setError('Please wait while we load your data...');
      return;
    }

    if (!user.organizationId) {
      setError('Organization data not found. Please try logging in again.');
      return;
    }

    setError(null);
  }, [user]);

  const handlePendingRequestsClick = () => {
    navigate('/admin/time-off-requests', {
      state: { initialFilter: { status: 'pending' } }
    });
  };

  // Calculate percentage of available staff
  const availablePercentage = totalEmployees > 0 
    ? Math.round((availableStaff / totalEmployees) * 100) 
    : 0;

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
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of your organization's time-off management
          </p>
        </div>

        {/* First Row: KPIs */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Pending Requests"
            value={requestsLoading ? '...' : pendingCount}
            description="Awaiting approval"
            icon={Clock}
            clickable={true}
            onClick={handlePendingRequestsClick}
            error={requestsError}
          />
          <StatsCard
            title="Total Employees"
            value={employeesLoading ? '...' : totalCount}
            description="Active employees"
            icon={Users}
            error={employeesError}
          />
          <StatsCard
            title="Available Staff"
            value={staffLoading ? '...' : availableStaff}
            description="Currently working"
            icon={UserCheck}
            trend={{
              value: `${availablePercentage}% of total`,
              positive: availablePercentage >= 80
            }}
            error={staffError}
          />
        </div>

        {/* Second Row: Availability Chart */}
        <AvailabilityChart />

        {/* Third Row: Shortage Table */}
        <ShortageTable />
      </div>
    </AdminLayout>
  );
}