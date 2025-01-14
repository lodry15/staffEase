import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLocations } from '@/lib/db/locations';
import { useAuthStore } from '@/store/auth';

interface RequestFiltersProps {
  onFilterChange: (filters: {
    search: string;
    type: string;
    status: string;
    location: string;
    startDate: string;
    endDate: string;
  }) => void;
}

export function RequestFilters({ onFilterChange }: RequestFiltersProps) {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    location: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    async function loadLocations() {
      if (!user?.organizationId) return;
      
      try {
        const fetchedLocations = await getLocations(user.organizationId);
        setLocations(fetchedLocations);
      } catch (error) {
        console.error('Error loading locations:', error);
      }
    }
    loadLocations();
  }, [user?.organizationId]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input - Wider */}
        <div className="relative flex-[2]">
          <Input
            type="text"
            placeholder="Search employee..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {/* Type Filter - Compact */}
        <Select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="w-32"
        >
          <option value="">Types</option>
          <option value="days_off">Days Off</option>
          <option value="hours_off">Hours Off</option>
          <option value="sick_leave">Sick Leave</option>
        </Select>

        {/* Status Filter - Compact */}
        <Select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="w-32"
        >
          <option value="">Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </Select>

        {/* Location Filter - Compact */}
        <Select
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="w-32"
        >
          <option value="">Locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </Select>

        {/* Date Range Picker - Compact */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-36"
            placeholder="Start date"
          />
          <span className="text-gray-500">-</span>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-36"
            placeholder="End date"
          />
        </div>
      </div>
    </div>
  );
}