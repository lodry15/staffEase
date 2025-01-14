import { DocumentReference, Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
  systemRole: string[];
  daysAvailable: number;
  hoursAvailable: number;
  annualDays: number;
  annualHours: number;
  roleId: DocumentReference | null;
  locationId: DocumentReference | null;
  createdBy: DocumentReference | null;
  createdAt: Timestamp | null;
  needsInitialSetup?: boolean;
}

export interface Role {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Timestamp;
  createdBy: DocumentReference;
}

export interface Location {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Timestamp;
  createdBy: DocumentReference;
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  locationId: string;
  daysAvailable: number;
  hoursAvailable: number;
  annualDays: number;
  annualHours: number;
  organizationId: string;
}

export interface UpdateEmployeeData {
  firstName: string;
  lastName: string;
  roleId: string;
  locationId: string;
  daysAvailable: number;
  hoursAvailable: number;
  annualDays: number;
  annualHours: number;
}

export interface Employee extends User {
  roleName: string;
  locationName: string;
}