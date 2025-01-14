import { useState, useEffect } from 'react';
import { collection, query, where, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInDays } from 'date-fns';

interface TimeOffRequest {
  id: string;
  createdAt: { seconds: number } | null;
  type: 'days_off' | 'hours_off' | 'sick_leave';
  startDate: { seconds: number };
  endDate?: { seconds: number };
  hoursOff: number;
  status: 'pending' | 'approved' | 'denied';
  notes?: string;
  adminComments?: string;
}

export function useTimeOffRequests(userId: string | undefined) {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const userRef = doc(db, 'users', userId);
    const requestsRef = collection(db, 'requests');
    const requestsQuery = query(
      requestsRef,
      where('userId', '==', userRef)
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const newRequests = snapshot.docs.map(doc => {
          const data = doc.data();
          const startDate = new Date(data.startDate.seconds * 1000);
          const endDate = data.endDate ? new Date(data.endDate.seconds * 1000) : startDate;
          
          // Calculate days only for days_off and sick_leave types
          const daysOff = (data.type === 'days_off' || data.type === 'sick_leave')
            ? differenceInDays(endDate, startDate) + 1 // Add 1 to include both start and end dates
            : 0;

          return {
            id: doc.id,
            ...data,
            daysOff,
          };
        });

        // Sort by creation date (newest first), handling null timestamps
        newRequests.sort((a, b) => {
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return b.createdAt.seconds - a.createdAt.seconds;
        });

        setRequests(newRequests);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching time-off requests:', error);
        setError('Failed to load requests. Please try again later.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { requests, loading, error };
}