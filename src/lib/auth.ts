import { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '@/types';

export async function getUserData(firebaseUser: FirebaseUser): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      console.error('No user document found for:', firebaseUser.uid);
      return null;
    }
    
    const userData = userDoc.data();
    return {
      id: firebaseUser.uid,
      ...userData,
    } as User;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export function getRedirectPath(user: User): string {
  if (!user.systemRole) {
    return '/login';
  }

  if (user.systemRole.includes('admin')) {
    return user.needsInitialSetup ? '/admin/initial-setup' : '/admin';
  }
  
  if (user.systemRole.includes('employee')) {
    return '/employee';
  }
  
  return '/login';
}