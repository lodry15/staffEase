import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';

interface AdminData extends User {
  systemRole: string[];
}

export function useAdminData(user: User | null) {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Fetch the admin user document
        const userDoc = await getDoc(doc(db, 'users', user.id));
        
        if (!userDoc.exists()) {
          throw new Error('Admin data not found');
        }

        const userData = userDoc.data();

        // Verify this is an admin user
        if (!userData.systemRole.includes('admin')) {
          throw new Error('User is not an administrator');
        }

        setAdminData({
          ...user,
          ...userData,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load administrator information');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  return { adminData, loading, error };
}