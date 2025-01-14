import { useState, useEffect } from 'react';
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RequestStats {
  pendingCount: number;
  loading: boolean;
  error: string | null;
}

export function useRequestStats(userId?: string) {
  const [stats, setStats] = useState<RequestStats>({
    pendingCount: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const requestsRef = collection(db, 'requests');
    
    // Create query based on whether we're filtering by userId
    const pendingQuery = userId 
      ? query(
          requestsRef,
          where('userId', '==', doc(db, 'users', userId)),
          where('status', '==', 'pending')
        )
      : query(
          requestsRef,
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
        console.error('Error fetching request stats:', error);
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