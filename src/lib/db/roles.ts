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
import { Role } from '@/types';

export async function getRoles(organizationId?: string): Promise<Role[]> {
  if (!organizationId) {
    return [];
  }

  try {
    const rolesRef = collection(db, 'roles');
    const q = query(
      rolesRef,
      where('organizationId', '==', organizationId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Role))
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  } catch (error) {
    console.error('Error in getRoles:', error);
    throw error;
  }
}

export async function createRole(
  name: string, 
  organizationId: string,
  createdById: string
): Promise<{ id: string }> {
  if (!name.trim() || !organizationId || !createdById) {
    throw new Error('Missing required fields for role creation');
  }

  try {
    const rolesRef = collection(db, 'roles');
    
    // Check if role name already exists in this organization
    const nameCheck = query(
      rolesRef, 
      where('organizationId', '==', organizationId),
      where('name', '==', name.trim())
    );
    const existingRoles = await getDocs(nameCheck);
    
    if (!existingRoles.empty) {
      throw new Error('A role with this name already exists in your organization');
    }
    
    const docRef = await addDoc(rolesRef, {
      name: name.trim(),
      organizationId,
      createdBy: doc(db, 'users', createdById),
      createdAt: serverTimestamp(),
    });

    return { id: docRef.id };
  } catch (error: any) {
    console.error('Error creating role:', error);
    throw new Error(error.message || 'Failed to create role');
  }
}

export async function updateRole(
  id: string, 
  name: string, 
  organizationId: string
): Promise<void> {
  if (!name.trim() || !organizationId) {
    throw new Error('Missing required fields for role update');
  }

  try {
    const rolesRef = collection(db, 'roles');
    
    // Check if new name conflicts with existing roles in the same organization
    const nameCheck = query(
      rolesRef,
      where('organizationId', '==', organizationId),
      where('name', '==', name.trim())
    );
    const existingRoles = await getDocs(nameCheck);
    
    if (!existingRoles.empty && existingRoles.docs[0].id !== id) {
      throw new Error('A role with this name already exists in your organization');
    }
    
    const roleRef = doc(db, 'roles', id);
    await updateDoc(roleRef, { 
      name: name.trim(),
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Error updating role:', error);
    throw new Error(error.message || 'Failed to update role');
  }
}

export async function deleteRole(id: string, organizationId: string): Promise<void> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  try {
    // Check if role is assigned to any users in this organization
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('organizationId', '==', organizationId),
      where('roleId', '==', doc(db, 'roles', id))
    );
    const assignedUsers = await getDocs(q);
    
    if (!assignedUsers.empty) {
      throw new Error('This role cannot be deleted as it is currently assigned to employees');
    }
    
    // Delete the role if no users are assigned to it
    const roleRef = doc(db, 'roles', id);
    await deleteDoc(roleRef);
  } catch (error: any) {
    console.error('Error deleting role:', error);
    throw new Error(error.message || 'Failed to delete role');
  }
}