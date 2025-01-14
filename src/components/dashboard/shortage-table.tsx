import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { useStaffShortage } from '@/hooks/use-staff-shortage';
import { useLocations } from '@/hooks/use-locations';

export function ShortageTable() {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { shortages, loading, error } = useStaffShortage(currentMonth, selectedLocation || undefined);
  const { locations } = useLocations();

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">Loading shortage data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Staff Shortage Days
          </h3>
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employees Short</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shortages.length > 0 ? (
              shortages.map((shortage, index) => (
                <TableRow key={index}>
                  <TableCell>{format(shortage.date, 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {shortage.employeesShort} of {shortage.totalEmployees}
                  </TableCell>
                  <TableCell>{shortage.locationName}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  No staff shortages found for {format(currentMonth, 'MMMM yyyy')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}