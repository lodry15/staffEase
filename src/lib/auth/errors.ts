export const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'This email is already registered',
  'auth/invalid-email': 'Invalid email format',
  'auth/operation-not-allowed': 'Email/password accounts are not enabled',
  'auth/weak-password': 'Password must be at least 6 characters',
  'auth/user-disabled': 'This account has been disabled',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'permission-denied': 'You do not have permission to perform this action',
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;

export function getErrorMessage(code: string): string {
  return AUTH_ERROR_MESSAGES[code as AuthErrorCode] || 'An unexpected error occurred';
}