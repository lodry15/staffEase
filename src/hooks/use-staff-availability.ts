import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay, isSameDay, isWithinInterval } from 'date-fns';
import { useAuthStore } from '@/store/auth';

interface DailyAvailability {
  date: Date;
  percentage: number;
  totalEmployees: number;
  availableStaff: number;
  locationName?: string;
}

export function useStaffAvailability(selectedMonth: Date, locationId?: string) {
  const { user } = useAuthStore();
  const [data, setData] = useState<DailyAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.organizationId) {
      setData([]);
      setLoading(false);
      return;
    }

    async function calculateAvailability() {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Calculate Total Employees
        const usersRef = collection(db, 'users');
        let employeesQuery = query(
          usersRef,
          where('organizationId', '==', user.organizationId),
          where('systemRole', 'array-contains', 'employee')
        );

        if (locationId) {
          const locationRef = doc(db, 'locations', locationId);
          employeesQuery = query(
            employeesQuery,
            where('locationId', '==', locationRef)
          );
        }

        const employeesSnapshot = await getDocs(employeesQuery);
        const totalEmployees = employeesSnapshot.size;

        if (totalEmployees === 0) {
          setData([]);
          return;
        }

        // Get location name if locationId is provided
        let selectedLocationName = 'All Locations';
        if (locationId) {
          const locationDoc = await getDoc(doc(db, 'locations', locationId));
          if (locationDoc.exists()) {
            selectedLocationName = locationDoc.data().name;
          }
        }

        // Step 2: Get all approved requests
        const requestsRef = collection(db, 'requests');
        const requestsQuery = query(
          requestsRef,
          where('organizationId', '==', user.organizationId),
          where('status', '==', 'approved'),
          where('type', 'in', ['days_off', 'sick_leave']) // Only consider days off and sick leave requests
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        
        // Step 3: Calculate availability for each day of the month
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        const availability = daysInMonth.map(date => {
          // Count employees on leave for this specific day
          const employeesOnLeave = requestsSnapshot.docs.reduce((count, doc) => {
            const data = doc.data();
            const startDate = startOfDay(new Date(data.startDate.seconds * 1000));
            const endDate = data.endDate 
              ? endOfDay(new Date(data.endDate.seconds * 1000))
              : endOfDay(startDate);

            // Check if the employee belongs to the selected location
            if (locationId) {
              const employeeDoc = employeesSnapshot.docs.find(emp => 
                emp.id === data.userId.id
              );
              if (!employeeDoc) return count;
            }

            // Check if the date falls within the leave period
            // Include both start and end dates in the check
            const currentDate = startOfDay(date);
            const isOnLeave = 
              isWithinInterval(currentDate, { start: startDate, end: endDate }) ||
              isSameDay(currentDate, startDate) ||
              isSameDay(currentDate, endDate);

            return isOnLeave ? count + 1 : count;
          }, 0);

          const availableStaff = Math.max(0, totalEmployees - employeesOnLeave);
          const percentage = Math.round((availableStaff / totalEmployees) * 100);

          return {
            date,
            percentage,
            totalEmployees,
            availableStaff,
            locationName: selectedLocationName
          };
        });

        setData(availability);
      } catch (err) {
        console.error('Error calculating staff availability:', err);
        setError('Failed to load availability data');
      } finally {
        setLoading(false);
      }
    }

    calculateAvailability();
  }, [selectedMonth, locationId, user?.organizationId]);

  return { data, loading, error };
}