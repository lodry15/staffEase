import { Select } from '@/components/ui/select';
import { format } from 'date-fns';

interface RequestFiltersProps {
  typeFilter: string;
  statusFilter: string;
  dateFilter: string;
  onTypeFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onDateFilterChange: (value: string) => void;
}

export function RequestFilters({
  typeFilter,
  statusFilter,
  dateFilter,
  onTypeFilterChange,
  onStatusFilterChange,
  onDateFilterChange,
}: RequestFiltersProps) {
  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    
    return options;
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Select
        value={typeFilter}
        onChange={(e) => onTypeFilterChange(e.target.value)}
        className="w-full h-12 sm:h-10"
      >
        <option value="">All Types</option>
        <option value="days_off">Days Off</option>
        <option value="hours_off">Hours Off</option>
        <option value="sick_leave">Sick Leave</option>
      </Select>

      <Select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="w-full h-12 sm:h-10"
      >
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="denied">Denied</option>
      </Select>

      <Select
        value={dateFilter}
        onChange={(e) => onDateFilterChange(e.target.value)}
        className="w-full h-12 sm:h-10"
      >
        <option value="">All Time</option>
        {getMonthOptions().map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
    </div>
  );
}