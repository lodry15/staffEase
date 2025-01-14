import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DateRange {
  startDate: string;
  endDate?: string;
  requestId?: string;
  userId: string;
}

export async function validateRequestDates(
  { startDate, endDate, requestId, userId }: DateRange
): Promise<{ isValid: boolean; error?: string }> {
  try {
    const userRef = doc(db, 'users', userId);
    const requestsRef = collection(db, 'requests');
    
    // Query existing requests for the user that are either pending or approved
    const q = query(
      requestsRef,
      where('userId', '==', userRef),
      where('status', 'in', ['pending', 'approved'])
    );

    const querySnapshot = await getDocs(q);
    const existingRequests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const newStartDate = new Date(startDate);
    const newEndDate = endDate ? new Date(endDate) : new Date(startDate);

    // Validate date order
    if (newStartDate > newEndDate) {
      return {
        isValid: false,
        error: 'Start date cannot be after end date'
      };
    }

    // Check for overlaps with existing requests
    for (const request of existingRequests) {
      // Skip checking against the current request when editing
      if (requestId && request.id === requestId) {
        continue;
      }

      // Convert Firestore timestamps to Date objects
      const existingStartDate = request.startDate?.toDate?.() || new Date(request.startDate.seconds * 1000);
      const existingEndDate = request.endDate?.toDate?.() || 
                             request.endDate?.seconds ? new Date(request.endDate.seconds * 1000) : 
                             existingStartDate;

      // Check if date ranges overlap
      const hasOverlap = (
        // New start date falls within existing request
        (newStartDate >= existingStartDate && newStartDate <= existingEndDate) ||
        // New end date falls within existing request
        (newEndDate >= existingStartDate && newEndDate <= existingEndDate) ||
        // Existing request falls completely within new dates
        (newStartDate <= existingStartDate && newEndDate >= existingEndDate)
      );

      if (hasOverlap) {
        // For editing, tell user to delete and create new request
        if (requestId) {
          return {
            isValid: false,
            error: 'You already have a request for this date range. Please delete this request and create a new one.'
          };
        }
        
        // For new requests, tell user to select different dates
        return {
          isValid: false,
          error: 'You already have a request for this date range. Please select different dates.'
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating request dates:', error);
    return {
      isValid: false,
      error: 'An error occurred while validating the request dates'
    };
  }
}