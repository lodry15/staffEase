import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  DocumentReference,
  deleteDoc,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInDays } from 'date-fns';

interface RequestData {
  type: 'days_off' | 'hours_off' | 'sick_leave';
  startDate: string;
  endDate?: string;
  hours?: string;
  notes?: string;
}

interface StoredRequest {
  userId: DocumentReference;
  organizationId: string;
  type: 'days_off' | 'hours_off' | 'sick_leave';
  startDate: Date;
  endDate?: Date;
  daysOff: number;
  hoursOff: number;
  notes?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: any;
}

async function calculateRequestDeduction(requestData: any): Promise<{ days: number; hours: number }> {
  const { type, startDate, endDate, hoursOff } = requestData;
  
  if (type === 'hours_off') {
    return { days: 0, hours: hoursOff || 0 };
  } else if (type === 'days_off') {
    const start = new Date(startDate.seconds * 1000);
    const end = new Date(endDate.seconds * 1000);
    const daysOff = differenceInDays(end, start) + 1; // Include both start and end dates
    return { days: daysOff, hours: 0 };
  } else {
    // For sick_leave type, return 0 for both
    return { days: 0, hours: 0 };
  }
}

async function restoreUserBalance(requestId: string): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Get the request document
      const requestRef = doc(db, 'requests', requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();
      const { userId, type, status } = requestData;

      // Only restore balance if request was approved and not sick leave
      if (status !== 'approved' || type === 'sick_leave') {
        return;
      }

      // Get the user document
      const userDoc = await transaction.get(userId);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const { days, hours } = await calculateRequestDeduction(requestData);
      
      // Restore the balance
      const newDaysBalance = userData.daysAvailable + days;
      const newHoursBalance = userData.hoursAvailable + hours;

      // Update user balance
      transaction.update(userId, {
        daysAvailable: newDaysBalance,
        hoursAvailable: newHoursBalance,
        updatedAt: serverTimestamp()
      });

      console.log('Balance restored:', { days, hours, newDaysBalance, newHoursBalance });
    });

    console.log('User balance restored successfully');
  } catch (error) {
    console.error('Error restoring user balance:', error);
    throw new Error('Failed to restore user balance');
  }
}

export async function createRequest(userId: string, data: RequestData): Promise<void> {
  try {
    // Create a reference to the user document
    const userRef = doc(db, 'users', userId);
    
    // Fetch user data to get organizationId
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const userData = userDoc.data();

    // Convert dates
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : new Date(data.startDate);

    // Validate dates
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    // Initialize request data with default values
    const requestData: StoredRequest = {
      userId: userRef,
      organizationId: userData.organizationId,
      type: data.type,
      startDate,
      daysOff: 0,
      hoursOff: 0,
      status: 'pending',
      createdAt: serverTimestamp(),
      notes: data.notes,
    };

    // Set type-specific fields
    if (data.type === 'days_off' || data.type === 'sick_leave') {
      requestData.endDate = endDate;
      requestData.daysOff = differenceInDays(endDate, startDate) + 1; // Include both start and end dates
      requestData.hoursOff = 0;
    } else if (data.type === 'hours_off') {
      requestData.hoursOff = data.hours ? Number(data.hours) : 0;
      requestData.daysOff = 0;
    }

    // Save request to Firestore
    await addDoc(collection(db, 'requests'), requestData);
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
}

export async function updateRequest(requestId: string, data: RequestData): Promise<void> {
  try {
    const requestRef = doc(db, 'requests', requestId);
    
    // Get the current request status
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const { status, type } = requestDoc.data();
    
    // If the request was approved and it's not a sick leave, restore the balance
    if (status === 'approved' && type !== 'sick_leave') {
      await restoreUserBalance(requestId);
    }
    
    // Convert dates
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : new Date(data.startDate);

    // Validate dates
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    // Calculate days off for days_off type
    let daysOff = 0;
    let hoursOff = 0;

    if (data.type === 'days_off') {
      daysOff = differenceInDays(endDate, startDate) + 1;
    } else if (data.type === 'hours_off') {
      hoursOff = data.hours ? Number(data.hours) : 0;
    }

    // Update the request
    await updateDoc(requestRef, {
      type: data.type,
      startDate,
      endDate: data.type === 'hours_off' ? null : endDate,
      daysOff,
      hoursOff,
      notes: data.notes,
      status: 'pending', // Reset status to pending
      processedBy: null,
      processedAt: null,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
}

export async function deleteRequest(requestId: string): Promise<void> {
  try {
    const requestRef = doc(db, 'requests', requestId);
    
    // Get the current request status
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) {
      throw new Error('Request not found');
    }

    const { status, type } = requestDoc.data();
    
    // If the request was approved and it's not a sick leave, restore the balance
    if (status === 'approved' && type !== 'sick_leave') {
      await restoreUserBalance(requestId);
    }
    
    // Delete the request document
    await deleteDoc(requestRef);
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
}