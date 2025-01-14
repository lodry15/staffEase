import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';

interface EmployeeData extends User {
  roleName?: string;
  locationName?: string;
}

export function useEmployeeData(user: User | null) {
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Fetch role and location data
        const [roleDoc, locationDoc] = await Promise.all([
          getDoc(user.roleId),
          getDoc(user.locationId)
        ]);

        setEmployeeData({
          ...user,
          roleName: roleDoc.exists() ? roleDoc.data()?.name : 'Unknown Role',
          locationName: locationDoc.exists() ? locationDoc.data()?.name : 'Unknown Location'
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching employee data:', err);
        setError('Failed to load employee information');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return { employeeData, loading, error };
}