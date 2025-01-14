import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { EmployeeLayout } from '@/components/layouts/employee-layout';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock } from 'lucide-react';
import { RequestForm } from '@/components/time-off/request-form';
import { createRequest } from '@/lib/db/requests';
import { Calendar } from '@/components/calendar/calendar';
import { useEmployeeRequestStats } from '@/hooks/use-employee-request-stats';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function EmployeeDashboard() {
  const { user } = useAuthStore();
  const { pendingCount, loading: statsLoading, error: statsError } = useEmployeeRequestStats(user?.id);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [balances, setBalances] = useState({ days: 0, hours: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const userRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setBalances({
            days: data.daysAvailable || 0,
            hours: data.hoursAvailable || 0
          });
          setError(null);
        } else {
          setError('User data not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user data:', err);
        setError('Failed to load balance data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const handleRequestSubmit = async (data: any) => {
    if (!user?.id) return;
    await createRequest(user.id, data);
  };

  return (
    <EmployeeLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back, {user?.firstName}
            </p>
          </div>

          <Button
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center text-sm"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Send a New Request
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          {/* Pending Requests Box */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-brand-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Pending Requests
                </p>
                <p className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
                  {statsLoading ? '...' : pendingCount}
                </p>
              </div>
            </div>
            {statsError && (
              <p className="mt-2 text-xs sm:text-sm text-red-600">{statsError}</p>
            )}
          </div>

          {/* Balance Days Box */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-brand-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Balance Days
                </p>
                <p className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
                  {loading ? '...' : `${balances.days} Days`}
                </p>
              </div>
            </div>
          </div>

          {/* Balance Hours Box */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-brand-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Balance Hours
                </p>
                <p className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
                  {loading ? '...' : `${balances.hours} Hours`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="-mx-2 sm:mx-0">
          {user?.id && <Calendar userId={user.id} />}
        </div>
      </div>

      <RequestForm
        open={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleRequestSubmit}
        daysAvailable={balances.days}
        hoursAvailable={balances.hours}
      />
    </EmployeeLayout>
  );
}