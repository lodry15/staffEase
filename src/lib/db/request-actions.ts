import { doc, updateDoc, serverTimestamp, getDoc, runTransaction, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { differenceInDays } from 'date-fns';

interface RequestAction {
  requestId: string;
  adminId: string;
}

async function calculateRequestDeduction(requestData: any): Promise<{ days: number; hours: number }> {
  const { type, startDate, endDate, hoursOff } = requestData;
  
  if (type === 'hours_off') {
    return { days: 0, hours: hoursOff || 0 };
  } else if (type === 'days_off') { // Only calculate days for days_off type
    const start = new Date(startDate.seconds * 1000);
    const end = new Date(endDate.seconds * 1000);
    const daysOff = differenceInDays(end, start) + 1; // Include both start and end dates
    return { days: daysOff, hours: 0 };
  } else {
    // For sick_leave type, return 0 for both
    return { days: 0, hours: 0 };
  }
}

async function updateUserBalance(requestId: string, action: 'approve' | 'restore'): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Get the request document
      const requestRef = doc(db, 'requests', requestId);
      const requestDoc = await transaction.get(requestRef);

      if (!requestDoc.exists()) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();
      const { userId, type } = requestData;

      // Skip balance update for sick leave
      if (type === 'sick_leave') {
        return;
      }

      // Get the user document
      const userDoc = await transaction.get(userId);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const { days, hours } = await calculateRequestDeduction(requestData);
      
      // Calculate new balances based on action
      let newDaysBalance = userData.daysAvailable;
      let newHoursBalance = userData.hoursAvailable;

      if (action === 'approve') {
        // Deduct from balance
        newDaysBalance = Math.max(0, userData.daysAvailable - days);
        newHoursBalance = Math.max(0, userData.hoursAvailable - hours);
      } else if (action === 'restore') {
        // Restore balance
        newDaysBalance = userData.daysAvailable + days;
        newHoursBalance = userData.hoursAvailable + hours;
      }

      // Update user balance
      transaction.update(userId, {
        daysAvailable: newDaysBalance,
        hoursAvailable: newHoursBalance,
        updatedAt: serverTimestamp()
      });

      console.log(`Balance ${action}d:`, { days, hours, newDaysBalance, newHoursBalance });
    });

    console.log('User balance updated successfully');
  } catch (error) {
    console.error('Error updating user balance:', error);
    throw new Error('Failed to update user balance');
  }
}

export async function approveRequest({ requestId, adminId }: RequestAction): Promise<void> {
  try {
    const requestRef = doc(db, 'requests', requestId);
    
    // First deduct from the user's balance
    await updateUserBalance(requestId, 'approve');

    // Then update the request status
    await updateDoc(requestRef, {
      status: 'approved',
      processedBy: doc(db, 'users', adminId),
      processedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error approving request:', error);
    throw error;
  }
}

export async function denyRequest({ requestId, adminId }: RequestAction): Promise<void> {
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
      await updateUserBalance(requestId, 'restore');
    }
    
    // Update request status
    await updateDoc(requestRef, {
      status: 'denied',
      processedBy: doc(db, 'users', adminId),
      processedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error denying request:', error);
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
      await updateUserBalance(requestId, 'restore');
    }
    
    // Actually delete the request document
    await deleteDoc(requestRef);
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
}

export async function updateRequest(requestId: string, data: any): Promise<void> {
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
      await updateUserBalance(requestId, 'restore');
    }
    
    // Update the request
    await updateDoc(requestRef, {
      ...data,
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