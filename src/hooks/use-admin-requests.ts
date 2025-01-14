import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { useAuthStore } from '@/store/auth';

interface AdminRequest {
  id: string;
  type: 'days_off' | 'hours_off' | 'sick_leave';
  startDate: { seconds: number };
  status: 'pending' | 'approved' | 'denied';
  employeeName: string;
  locationName: string;
  userId: any;
  locationId: string;
}

interface Filters {
  search: string;
  type: string;
  status: string;
  location: string;
  startDate: string;
  endDate: string;
}

export function useAdminRequests(filters?: Filters) {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRequests, setAllRequests] = useState<AdminRequest[]>([]);

  useEffect(() => {
    if (!user?.organizationId) {
      setRequests([]);
      setAllRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const requestsRef = collection(db, 'requests');
    const requestsQuery = query(
      requestsRef,
      where('organizationId', '==', user.organizationId)
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      async (snapshot) => {
        try {
          const requestsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data();
              let employeeName = 'Unknown';
              let locationName = 'Unknown Location';
              let locationId = '';

              if (data.userId) {
                try {
                  const userDoc = await getDoc(data.userId);
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    employeeName = `${userData.firstName} ${userData.lastName}`;

                    if (userData.locationId) {
                      const locationDoc = await getDoc(userData.locationId);
                      if (locationDoc.exists()) {
                        locationName = locationDoc.data().name;
                        locationId = locationDoc.id;
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error fetching user or location details:', error);
                }
              }

              return {
                id: doc.id,
                ...data,
                employeeName,
                locationName,
                locationId,
              };
            })
          );

          setAllRequests(requestsData);
          setError(null);
        } catch (err) {
          console.error('Error processing requests:', err);
          setError('Failed to load requests');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching requests:', err);
        setError('Failed to load requests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.organizationId]);

  useEffect(() => {
    if (!filters) {
      setRequests(allRequests);
      return;
    }

    let filteredRequests = [...allRequests];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredRequests = filteredRequests.filter(request =>
        request.employeeName.toLowerCase().includes(searchTerm)
      );
    }

    // Apply type filter
    if (filters.type) {
      filteredRequests = filteredRequests.filter(request =>
        request.type === filters.type
      );
    }

    // Apply status filter
    if (filters.status) {
      filteredRequests = filteredRequests.filter(request =>
        request.status === filters.status
      );
    }

    // Apply location filter
    if (filters.location) {
      filteredRequests = filteredRequests.filter(request => 
        request.locationId === filters.location
      );
    }

    // Apply date range filter
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? startOfDay(parseISO(filters.startDate)) : new Date(0);
      const end = filters.endDate ? endOfDay(parseISO(filters.endDate)) : new Date(8640000000000000);
      
      filteredRequests = filteredRequests.filter(request => {
        const requestDate = new Date(request.startDate.seconds * 1000);
        return isWithinInterval(requestDate, { start, end });
      });
    }

    // Sort by start date (newest first)
    filteredRequests.sort((a, b) => b.startDate.seconds - a.startDate.seconds);

    setRequests(filteredRequests);
  }, [filters, allRequests]);

  return { requests, loading, error };
}