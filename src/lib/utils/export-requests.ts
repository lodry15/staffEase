import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

interface ExportableRequest {
  requestId: string;
  createdAt: string;
  createdBy: string;
  location: string;
  type: string;
  start: string;
  end: string;
  status: string;
  daysOff: number;
  hoursOff: number;
  processedAt: string;
  processedBy: string;
}

interface ExportFilters {
  search?: string;
  type?: string;
  status?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
}

const requestTypeLabels = {
  days_off: 'Days Off',
  hours_off: 'Hours Off',
  sick_leave: 'Sick Leave',
};

export async function prepareRequestsForExport(organizationId: string, filters: ExportFilters): Promise<ExportableRequest[]> {
  try {
    // Build the base query
    const requestsRef = collection(db, 'requests');
    let requestQuery = query(
      requestsRef,
      where('organizationId', '==', organizationId)
    );

    // Add type filter if specified
    if (filters.type) {
      requestQuery = query(requestQuery, where('type', '==', filters.type));
    }

    // Add status filter if specified
    if (filters.status) {
      requestQuery = query(requestQuery, where('status', '==', filters.status));
    }

    // Execute query
    const snapshot = await getDocs(requestQuery);
    
    // Check if result exceeds limit
    if (snapshot.size > 1000) {
      throw new Error('Export limit exceeded: Maximum 1,000 rows allowed');
    }

    // Process results
    const requests = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let employeeName = 'Unknown';
        let locationName = 'Unknown Location';
        let processedByName = '';

        // Fetch employee details
        if (data.userId) {
          try {
            const userDoc = await getDoc(data.userId);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              employeeName = `${userData.firstName} ${userData.lastName}`;

              // Fetch location details
              if (userData.locationId) {
                const locationDoc = await getDoc(userData.locationId);
                if (locationDoc.exists()) {
                  locationName = locationDoc.data().name;
                }
              }
            }
          } catch (error) {
            console.error('Error fetching employee details:', error);
          }
        }

        // Fetch processor details
        if (data.processedBy) {
          try {
            const processorDoc = await getDoc(data.processedBy);
            if (processorDoc.exists()) {
              const processorData = processorDoc.data();
              processedByName = `${processorData.firstName} ${processorData.lastName}`;
            }
          } catch (error) {
            console.error('Error fetching processor details:', error);
          }
        }

        // Format dates
        const formatDate = (timestamp: any) => {
          if (!timestamp) return '';
          return format(new Date(timestamp.seconds * 1000), 'yyyy-MM-dd HH:mm:ss');
        };

        const requestDate = new Date(data.startDate.seconds * 1000);

        // Apply date range filter if specified
        if (filters.startDate || filters.endDate) {
          const start = filters.startDate ? startOfDay(parseISO(filters.startDate)) : new Date(0);
          const end = filters.endDate ? endOfDay(parseISO(filters.endDate)) : new Date(8640000000000000);
          
          if (!start || !end || requestDate < start || requestDate > end) {
            return null;
          }
        }

        // Apply location filter if specified
        if (filters.location && locationName !== filters.location) {
          return null;
        }

        // Apply search filter if specified
        if (filters.search && !employeeName.toLowerCase().includes(filters.search.toLowerCase())) {
          return null;
        }

        return {
          requestId: doc.id,
          createdAt: formatDate(data.createdAt),
          createdBy: employeeName,
          location: locationName,
          type: requestTypeLabels[data.type as keyof typeof requestTypeLabels],
          start: formatDate(data.startDate),
          end: formatDate(data.endDate) || formatDate(data.startDate),
          status: data.status.charAt(0).toUpperCase() + data.status.slice(1),
          daysOff: data.type === 'hours_off' ? 0 : (data.daysOff || 0),
          hoursOff: data.type === 'hours_off' ? (data.hoursOff || 0) : 0,
          processedAt: formatDate(data.processedAt),
          processedBy: processedByName
        };
      })
    );

    // Filter out null values and sort by created date
    return requests
      .filter((request): request is ExportableRequest => request !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  } catch (error) {
    console.error('Error preparing requests for export:', error);
    throw error;
  }
}