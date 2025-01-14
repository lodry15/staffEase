import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  DocumentReference,
} from 'firebase/firestore';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { db } from '@/lib/firebase';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/types';
import { generateTemporaryPassword } from '@/lib/utils/password';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/lib/firebase';

// Create a separate Firebase app instance for employee operations
const employeeApp = initializeApp(firebaseConfig, 'employeeApp');
const employeeAuth = getAuth(employeeApp);

// Set persistence for employee auth
setPersistence(employeeAuth, browserLocalPersistence)
  .catch((error) => {
    console.error('Error setting employee auth persistence:', error);
  });

export async function getEmployees(organizationId?: string): Promise<Employee[]> {
  if (!organizationId) {
    return [];
  }

  try {
    const employeesRef = collection(db, 'users');
    const q = query(
      employeesRef,
      where('organizationId', '==', organizationId),
      where('systemRole', 'array-contains', 'employee')
    );
    
    const querySnapshot = await getDocs(q);
    
    const employees = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        
        try {
          const [roleDoc, locationDoc] = await Promise.all([
            getDoc(data.roleId),
            getDoc(data.locationId)
          ]);

          return {
            id: doc.id,
            ...data,
            roleName: roleDoc.exists() ? roleDoc.data()?.name : 'Unknown Role',
            locationName: locationDoc.exists() ? locationDoc.data()?.name : 'Unknown Location',
          } as Employee;
        } catch (error) {
          console.error(`Error fetching references for employee ${doc.id}:`, error);
          return {
            id: doc.id,
            ...data,
            roleName: 'Unknown Role',
            locationName: 'Unknown Location',
          } as Employee;
        }
      })
    );

    return employees.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
  } catch (error) {
    console.error('Error in getEmployees:', error);
    throw error;
  }
}

export async function createEmployee(
  data: CreateEmployeeData,
  createdById: string
): Promise<void> {
  const { roleId, locationId, email, organizationId, ...rest } = data;

  // Validate numeric fields
  const numericFields = ['daysAvailable', 'hoursAvailable', 'annualDays', 'annualHours'];
  for (const field of numericFields) {
    const value = rest[field as keyof typeof rest];
    if (typeof value !== 'number' || value < 0) {
      throw new Error(`${field} must be a non-negative number`);
    }
  }

  // Generate temporary password
  const temporaryPassword = generateTemporaryPassword();

  try {
    // Get the current admin auth state
    const adminAuth = getAuth();
    const adminUser = adminAuth.currentUser;

    if (!adminUser) {
      throw new Error('Admin authentication required');
    }

    // Create new employee account
    const userCredential = await createUserWithEmailAndPassword(
      employeeAuth,
      email.toLowerCase(),
      temporaryPassword
    );

    // Create employee document
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...rest,
      email: email.toLowerCase(),
      organizationId,
      roleId: doc(db, 'roles', roleId),
      locationId: doc(db, 'locations', locationId),
      systemRole: ['employee'],
      temporaryPassword,
      createdBy: doc(db, 'users', createdById),
      createdAt: serverTimestamp(),
    });

    // Sign out from employee auth
    await signOut(employeeAuth);

  } catch (error: any) {
    // Clean up if something fails
    await signOut(employeeAuth);

    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists');
    }
    throw error;
  }
}

export async function updateEmployee(
  id: string,
  data: UpdateEmployeeData
): Promise<void> {
  const { roleId, locationId, ...rest } = data;

  // Validate numeric fields
  const numericFields = ['daysAvailable', 'hoursAvailable', 'annualDays', 'annualHours'];
  for (const field of numericFields) {
    const value = rest[field as keyof typeof rest];
    if (typeof value !== 'number' || value < 0) {
      throw new Error(`${field} must be a non-negative number`);
    }
  }

  // Only include fields that should be updated
  const updates = {
    ...rest,
    roleId: doc(db, 'roles', roleId),
    locationId: doc(db, 'locations', locationId),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, 'users', id), updates);
}

export async function deleteEmployee(id: string, organizationId: string): Promise<void> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  try {
    // Get employee data to check for dependencies
    const employeeRef = doc(db, 'users', id);
    const employeeDoc = await getDoc(employeeRef);
    
    if (!employeeDoc.exists()) {
      throw new Error('Employee not found');
    }

    const employeeData = employeeDoc.data();

    // Verify employee belongs to the organization
    if (employeeData.organizationId !== organizationId) {
      throw new Error('Employee does not belong to your organization');
    }

    // Check for active time-off requests
    const requestsRef = collection(db, 'requests');
    const activeRequestsQuery = query(
      requestsRef,
      where('userId', '==', employeeRef),
      where('status', '==', 'pending')
    );
    const activeRequests = await getDocs(activeRequestsQuery);

    if (!activeRequests.empty) {
      throw new Error('Cannot delete employee with pending time-off requests');
    }

    // Get the current admin auth state
    const adminAuth = getAuth();
    const adminUser = adminAuth.currentUser;

    if (!adminUser) {
      throw new Error('Admin authentication required');
    }

    try {
      // Try to sign in with employee credentials
      const userCredential = await signInWithEmailAndPassword(
        employeeAuth,
        employeeData.email,
        employeeData.temporaryPassword || 'dummy-password'
      );

      // Delete the auth account
      await deleteUser(userCredential.user);
    } catch (authError) {
      console.error('Error deleting auth account:', authError);
      // Continue with Firestore deletion even if auth deletion fails
    } finally {
      // Always sign out from employee auth
      await signOut(employeeAuth);
    }

    // Delete the Firestore document
    await deleteDoc(employeeRef);
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    throw new Error(error.message || 'Failed to delete employee');
  }
}