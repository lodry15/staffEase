import { useState, useEffect } from 'react';
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EmployeeRequestStats {
  pendingCount: number;
  loading: boolean;
  error: string | null;
}

export function useEmployeeRequestStats(userId: string | undefined) {
  const [stats, setStats] = useState<EmployeeRequestStats>({
    pendingCount: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!userId) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'User ID is required'
      }));
      return;
    }

    const requestsRef = collection(db, 'requests');
    const pendingQuery = query(
      requestsRef,
      where('userId', '==', doc(db, 'users', userId)),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      pendingQuery,
      (snapshot) => {
        setStats({
          pendingCount: snapshot.size,
          loading: false,
          error: null
        });
      },
      (error) => {
        console.error('Error fetching employee request stats:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load request statistics'
        }));
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return stats;
}