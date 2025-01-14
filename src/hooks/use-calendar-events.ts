import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface CalendarEvent {
  type: 'days_off' | 'hours_off' | 'sick_leave';
  status: 'pending' | 'approved';
  hours?: number;
}

interface CalendarEvents {
  [date: string]: CalendarEvent;
}

export function useCalendarEvents(userId: string | undefined, currentMonth: Date) {
  const [events, setEvents] = useState<CalendarEvents>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    // Create a reference to the user document
    const userRef = doc(db, 'users', userId);
    
    const requestsRef = collection(db, 'requests');
    const requestsQuery = query(
      requestsRef,
      where('userId', '==', userRef), // Use document reference instead of string
      where('status', 'in', ['approved', 'pending'])
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const newEvents: CalendarEvents = {};

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          
          // Handle both Timestamp and regular Date objects
          const startDate = data.startDate?.toDate?.() || new Date(data.startDate.seconds * 1000);
          const endDate = data.endDate 
            ? (data.endDate?.toDate?.() || new Date(data.endDate.seconds * 1000))
            : startDate;
          
          // Only process events that fall within the current month
          if (startDate <= end && endDate >= start) {
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
              const dateKey = format(currentDate, 'yyyy-MM-dd');
              newEvents[dateKey] = {
                type: data.type,
                status: data.status,
                ...(data.type === 'hours_off' && { hours: data.hoursOff }),
              };
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
        });

        setEvents(newEvents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching calendar events:', err);
        setLoading(false);
        setError('Failed to load calendar data');
      }
    );

    return () => unsubscribe();
  }, [userId, currentMonth]);

  return { events, loading, error };
}