import { Timestamp } from 'firebase/firestore';

export function dateRangesOverlap(
  range1Start: Date,
  range1End: Date,
  range2Start: Date,
  range2End: Date
): boolean {
  return (
    (range1Start <= range2End && range1End >= range2Start) ||
    (range2Start <= range1End && range2End >= range1Start)
  );
}

export function timestampToDate(timestamp: Timestamp | { seconds: number }): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp.seconds * 1000);
}

export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  return (
    startDate instanceof Date &&
    endDate instanceof Date &&
    !isNaN(startDate.getTime()) &&
    !isNaN(endDate.getTime()) &&
    startDate <= endDate
  );
}