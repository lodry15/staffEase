import { useState } from 'react';
import { Select } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addMonths, subMonths } from 'date-fns';
import { useStaffAvailability } from '@/hooks/use-staff-availability';
import { useLocations } from '@/hooks/use-locations';
import { cn } from '@/lib/utils';

export function AvailabilityChart() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data, loading, error } = useStaffAvailability(currentMonth, selectedLocation || undefined);
  const { locations } = useLocations();

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading availability data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Staff Availability</h3>
          <p className="text-sm text-gray-500 mt-1">{format(currentMonth, 'MMMM yyyy')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="min-w-[160px]"
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex h-64">
            {data.map((day, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col justify-end px-1"
              >
                {day.percentage === 0 ? (
                  // Zero availability indicator
                  <div className="h-full flex flex-col items-center justify-end">
                    <div 
                      className="w-full h-8 bg-red-100 rounded-t-sm flex items-center justify-center animate-pulse"
                      title={`No staff available (0 of ${day.totalEmployees})`}
                    >
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                ) : (
                  // Normal availability bar
                  <div
                    className={cn(
                      'rounded-t-sm transition-all duration-200 hover:opacity-80',
                      day.percentage < 60 ? 'bg-red-200' : 'bg-brand-purple-100'
                    )}
                    style={{ height: `${day.percentage}%` }}
                    title={`${day.availableStaff} of ${day.totalEmployees} staff available (${day.percentage}%)`}
                  >
                    <div 
                      className={cn(
                        'h-full',
                        day.percentage < 60 ? 'bg-red-500' : 'bg-brand-purple-500',
                        'bg-opacity-20'
                      )} 
                    />
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {format(day.date, 'd')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}