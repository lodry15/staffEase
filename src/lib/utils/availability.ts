import { DocumentReference } from 'firebase/firestore';

export interface AvailabilityData {
  date: Date;
  percentage: number;
  totalEmployees: number;
  availableStaff: number;
}

export interface LeaveRequest {
  startDate: Date;
  endDate: Date;
  userId: DocumentReference;
}

export function calculateDailyAvailability(
  date: Date,
  totalEmployees: number,
  requests: LeaveRequest[]
): AvailabilityData {
  // Count employees on leave for this day
  const employeesOnLeave = requests.filter(request => {
    return date >= request.startDate && date <= request.endDate;
  }).length;

  const availableStaff = Math.max(0, totalEmployees - employeesOnLeave);
  const percentage = totalEmployees > 0 
    ? Math.round((availableStaff / totalEmployees) * 100)
    : 0;

  return {
    date,
    percentage,
    totalEmployees,
    availableStaff
  };
}