import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Location } from '@/types';

export async function getLocations(organizationId?: string): Promise<Location[]> {
  if (!organizationId) {
    return [];
  }

  try {
    const locationsRef = collection(db, 'locations');
    const q = query(
      locationsRef,
      where('organizationId', '==', organizationId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Location))
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  } catch (error) {
    console.error('Error in getLocations:', error);
    throw error;
  }
}

export async function createLocation(
  name: string, 
  organizationId: string,
  createdById: string
): Promise<{ id: string }> {
  if (!name.trim() || !organizationId || !createdById) {
    throw new Error('Missing required fields for location creation');
  }

  try {
    const locationsRef = collection(db, 'locations');
    
    // Check if location name already exists in this organization
    const nameCheck = query(
      locationsRef,
      where('organizationId', '==', organizationId),
      where('name', '==', name.trim())
    );
    const existingLocations = await getDocs(nameCheck);
    
    if (!existingLocations.empty) {
      throw new Error('A location with this name already exists in your organization');
    }
    
    const docRef = await addDoc(locationsRef, {
      name: name.trim(),
      organizationId,
      createdBy: doc(db, 'users', createdById),
      createdAt: serverTimestamp(),
    });

    return { id: docRef.id };
  } catch (error: any) {
    console.error('Error creating location:', error);
    throw new Error(error.message || 'Failed to create location');
  }
}

export async function updateLocation(
  id: string, 
  name: string, 
  organizationId: string
): Promise<void> {
  if (!name.trim() || !organizationId) {
    throw new Error('Missing required fields for location update');
  }

  try {
    const locationsRef = collection(db, 'locations');
    
    // Check if new name conflicts with existing locations in the same organization
    const nameCheck = query(
      locationsRef,
      where('organizationId', '==', organizationId),
      where('name', '==', name.trim())
    );
    const existingLocations = await getDocs(nameCheck);
    
    if (!existingLocations.empty && existingLocations.docs[0].id !== id) {
      throw new Error('A location with this name already exists in your organization');
    }
    
    const locationRef = doc(db, 'locations', id);
    await updateDoc(locationRef, { 
      name: name.trim(),
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Error updating location:', error);
    throw new Error(error.message || 'Failed to update location');
  }
}

export async function deleteLocation(id: string, organizationId: string): Promise<void> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  try {
    // Check if location is assigned to any users in this organization
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('organizationId', '==', organizationId),
      where('locationId', '==', doc(db, 'locations', id))
    );
    const assignedUsers = await getDocs(q);
    
    if (!assignedUsers.empty) {
      throw new Error('This location cannot be deleted as it is currently assigned to employees');
    }
    
    // Delete the location if no users are assigned to it
    const locationRef = doc(db, 'locations', id);
    await deleteDoc(locationRef);
  } catch (error: any) {
    console.error('Error deleting location:', error);
    throw new Error(error.message || 'Failed to delete location');
  }
}