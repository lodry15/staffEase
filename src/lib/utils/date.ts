import { Timestamp } from 'firebase/firestore';
import { startOfDay, endOfDay } from 'date-fns';

export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function timestampToDate(timestamp: Timestamp | { seconds: number }): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp.seconds * 1000);
}

export function getDayBounds(date: Date) {
  return {
    start: dateToTimestamp(startOfDay(date)),
    end: dateToTimestamp(endOfDay(date))
  };
}