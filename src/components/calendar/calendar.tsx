import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarEvents } from '@/hooks/use-calendar-events';

interface CalendarProps {
  userId: string;
}

export function Calendar({ userId }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, loading, error } = useCalendarEvents(userId, currentMonth);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <p className="text-sm sm:text-base text-gray-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-center h-48 sm:h-64">
          <p className="text-sm sm:text-base text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={previousMonth}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 sm:p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px sm:gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-xs sm:text-sm font-medium text-gray-500 pb-1 sm:pb-2"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div key={`empty-start-${index}`} className="aspect-square" />
        ))}

        {calendarDays.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const event = events[dateKey];
          const isCurrentMonth = isSameMonth(date, currentMonth);

          return (
            <div
              key={dateKey}
              className={cn(
                'aspect-square relative group m-0.5',
                'rounded-lg transition-all duration-200',
                !isCurrentMonth && 'opacity-0 pointer-events-none',
                event?.status === 'approved' && 'bg-green-50',
                event?.status === 'pending' && 'bg-amber-50'
              )}
            >
              <time
                dateTime={dateKey}
                className={cn(
                  'absolute inset-x-0 top-1 flex justify-center text-xs sm:text-sm font-semibold',
                  event?.status === 'approved' && 'text-green-900',
                  event?.status === 'pending' && 'text-amber-900',
                  !event && 'text-gray-900'
                )}
              >
                {format(date, 'd')}
              </time>
              {event && (
                <span
                  className={cn(
                    'absolute inset-x-0 bottom-1 text-[10px] sm:text-xs text-center px-1 font-medium',
                    'hidden sm:block',
                    event.status === 'approved' && 'text-green-800',
                    event.status === 'pending' && 'text-amber-800'
                  )}
                >
                  {event.type === 'hours_off' 
                    ? `${event.hours}h Off`
                    : event.type === 'sick_leave'
                    ? 'Sick'
                    : 'Off'}
                </span>
              )}
            </div>
          );
        })}

        {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
          <div key={`empty-end-${index}`} className="aspect-square" />
        ))}
      </div>
    </div>
  );
}