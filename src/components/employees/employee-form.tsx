import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { NumberInput } from '@/components/ui/number-input';
import { Role, Location } from '@/types';
import { getRoles } from '@/lib/db/roles';
import { getLocations } from '@/lib/db/locations';
import { validateEmail } from '@/lib/validations';
import { useAuthStore } from '@/store/auth';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email?: string;
  roleId: string;
  locationId: string;
  daysAvailable: number;
  hoursAvailable: number;
  annualDays: number;
  annualHours: number;
}

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormData>;
  isEditing?: boolean;
  onChange: (data: EmployeeFormData, isValid: boolean) => void;
  error?: string;
}

export function EmployeeForm({ 
  initialData, 
  isEditing,
  onChange,
  error
}: EmployeeFormProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    roleId: initialData?.roleId || '',
    locationId: initialData?.locationId || '',
    daysAvailable: initialData?.daysAvailable || 0,
    hoursAvailable: initialData?.hoursAvailable || 0,
    annualDays: initialData?.annualDays || 0,
    annualHours: initialData?.annualHours || 0,
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load roles and locations
  useEffect(() => {
    async function loadData() {
      if (!user?.organizationId) {
        setLoadError('Organization data not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);
        
        const [fetchedRoles, fetchedLocations] = await Promise.all([
          getRoles(user.organizationId),
          getLocations(user.organizationId)
        ]);

        setRoles(fetchedRoles);
        setLocations(fetchedLocations);
      } catch (error) {
        console.error('Error loading form data:', error);
        setLoadError('Failed to load roles and locations');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user?.organizationId]);

  // Validate form data when it changes
  useEffect(() => {
    validateForm(formData);
  }, [formData]);

  const validateForm = (data: EmployeeFormData) => {
    let isValid = true;

    // Required fields validation
    if (!data.firstName.trim()) {
      isValid = false;
    }

    if (!data.lastName.trim()) {
      isValid = false;
    }

    if (!isEditing) {
      if (!data.email) {
        isValid = false;
      } else if (!validateEmail(data.email)) {
        isValid = false;
      }
    }

    if (!data.roleId) {
      isValid = false;
    }

    if (!data.locationId) {
      isValid = false;
    }

    // Numeric fields validation
    if (data.daysAvailable < 0 || data.hoursAvailable < 0 || 
        data.annualDays < 0 || data.annualHours < 0) {
      isValid = false;
    }

    onChange(data, isValid);
  };

  const handleChange = (
    field: keyof EmployeeFormData,
    value: string | number
  ) => {
    const newData = {
      ...formData,
      [field]: value
    };
    setFormData(newData);
    validateForm(newData);
  };

  if (loading) {
    return <div className="text-center py-4">Loading form data...</div>;
  }

  if (loadError) {
    return <div className="bg-red-50 text-red-800 p-4 rounded-md">{loadError}</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
          />
        </div>
      </div>

      {!isEditing && (
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <Select
            id="roleId"
            value={formData.roleId}
            onChange={(e) => handleChange('roleId', e.target.value)}
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1">
            Location *
          </label>
          <Select
            id="locationId"
            value={formData.locationId}
            onChange={(e) => handleChange('locationId', e.target.value)}
          >
            <option value="">Select a location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="daysAvailable" className="block text-sm font-medium text-gray-700 mb-1">
            Days Available
          </label>
          <NumberInput
            id="daysAvailable"
            min={0}
            value={formData.daysAvailable}
            onChange={(e) => handleChange('daysAvailable', parseInt(e.target.value) || 0)}
          />
        </div>

        <div>
          <label htmlFor="hoursAvailable" className="block text-sm font-medium text-gray-700 mb-1">
            Hours Available
          </label>
          <NumberInput
            id="hoursAvailable"
            min={0}
            value={formData.hoursAvailable}
            onChange={(e) => handleChange('hoursAvailable', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="annualDays" className="block text-sm font-medium text-gray-700 mb-1">
            Annual Leave Days
          </label>
          <NumberInput
            id="annualDays"
            min={0}
            value={formData.annualDays}
            onChange={(e) => handleChange('annualDays', parseInt(e.target.value) || 0)}
          />
        </div>

        <div>
          <label htmlFor="annualHours" className="block text-sm font-medium text-gray-700 mb-1">
            Annual Leave Hours
          </label>
          <NumberInput
            id="annualHours"
            min={0}
            value={formData.annualHours}
            onChange={(e) => handleChange('annualHours', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}