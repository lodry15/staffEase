import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { getErrorMessage } from './errors';

interface SignupData {
  organization: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface SignupResult {
  success: boolean;
  userId?: string;
  organizationId?: string;
  needsInitialSetup?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export async function signupAdmin(data: SignupData): Promise<SignupResult> {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email.toLowerCase(),
      data.password
    );

    // Generate a unique organizationId from the organization name
    const organizationId = data.organization.toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric chars with dash
      + '-' + userCredential.user.uid.slice(0, 8); // Add part of uid for uniqueness

    // Create user document
    const userRef = doc(db, 'users', userCredential.user.uid);
    const userData = {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.toLowerCase(),
      organizationId,
      organization: data.organization.trim(),
      systemRole: ['admin'],
      createdAt: serverTimestamp(),
      daysAvailable: 0,
      hoursAvailable: 0,
      annualDays: 0,
      annualHours: 0,
      needsInitialSetup: true,
      roleId: null,
      locationId: null,
      createdBy: null
    };

    await setDoc(userRef, userData);

    return {
      success: true,
      userId: userCredential.user.uid,
      organizationId,
      needsInitialSetup: true
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    
    return {
      success: false,
      error: {
        code: error.code || 'unknown',
        message: getErrorMessage(error.code)
      }
    };
  }
}