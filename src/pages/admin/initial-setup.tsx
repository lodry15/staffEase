import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { createRole } from '@/lib/db/roles';
import { createLocation } from '@/lib/db/locations';
import { createEmployee } from '@/lib/db/employees';
import { Role, Location } from '@/types';

interface Step1Data {
  role: string;
  location: string;
}

interface Step2Data {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  locationId: string;
  daysAvailable: number;
  hoursAvailable: number;
  annualDays: number;
  annualHours: number;
}

export function InitialSetupPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [step1Data, setStep1Data] = useState<Step1Data>({
    role: '',
    location: '',
  });

  const [step2Data, setStep2Data] = useState<Step2Data>({
    firstName: '',
    lastName: '',
    email: '',
    roleId: '',
    locationId: '',
    daysAvailable: 0,
    hoursAvailable: 0,
    annualDays: 0,
    annualHours: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!user.needsInitialSetup) {
      navigate('/admin');
      return;
    }
  }, [user, navigate]);

  const handleStep1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStep1Data(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStep2Change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric inputs
    if (['daysAvailable', 'hoursAvailable', 'annualDays', 'annualHours'].includes(name)) {
      const numValue = Math.max(0, parseInt(value) || 0);
      setStep2Data(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setStep2Data(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !user.organizationId) {
      setError('User authentication required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create role and location
      const [roleResult, locationResult] = await Promise.all([
        createRole(step1Data.role, user.organizationId, user.id),
        createLocation(step1Data.location, user.organizationId, user.id)
      ]);

      // Set initial role and location IDs for step 2
      setStep2Data(prev => ({
        ...prev,
        roleId: roleResult.id,
        locationId: locationResult.id
      }));

      // Update roles and locations state
      setRoles([{ 
        id: roleResult.id, 
        name: step1Data.role,
        organizationId: user.organizationId,
        createdAt: new Date(),
        createdBy: doc(db, 'users', user.id)
      }]);
      
      setLocations([{
        id: locationResult.id,
        name: step1Data.location,
        organizationId: user.organizationId,
        createdAt: new Date(),
        createdBy: doc(db, 'users', user.id)
      }]);

      // Move to step 2
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Step 1 error:', err);
      setError(err.message || 'Failed to create role and location');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !user.organizationId) {
      setError('User authentication required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create employee with organizationId
      await createEmployee({
        ...step2Data,
        organizationId: user.organizationId
      }, user.id);

      // Update user's needsInitialSetup flag and references
      const userRef = doc(db, 'users', user.id);
      const roleRef = doc(db, 'roles', step2Data.roleId);
      const locationRef = doc(db, 'locations', step2Data.locationId);
      
      await updateDoc(userRef, {
        needsInitialSetup: false,
        roleId: roleRef,
        locationId: locationRef
      });

      // Update local user state to maintain authentication
      const updatedUser = {
        ...user,
        needsInitialSetup: false,
        roleId: roleRef,
        locationId: locationRef
      };
      setUser(updatedUser);

      // Navigate to admin dashboard
      navigate('/admin', { replace: true });
    } catch (err: any) {
      console.error('Step 2 error:', err);
      setError(err.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rest of the component remains the same...
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Complete Your Organization Setup
          </h2>
          <div className="mt-2 inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
            Step {currentStep} of 2
          </div>
          <p className="mt-4 text-gray-600">
            {currentStep === 1 
              ? 'Set up your first role and location'
              : 'Create your first employee profile'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {currentStep === 1 ? (
          <form onSubmit={handleStep1Submit} className="mt-8 space-y-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name
                </label>
                <Input
                  id="role"
                  name="role"
                  value={step1Data.role}
                  onChange={handleStep1Change}
                  placeholder="e.g., Manager, Supervisor"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter the first job position in your organization
                </p>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location Name
                </label>
                <Input
                  id="location"
                  name="location"
                  value={step1Data.location}
                  onChange={handleStep1Change}
                  placeholder="e.g., Main Office, Downtown Branch"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter your first workplace location
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Continue'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="mt-8 space-y-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={step2Data.firstName}
                    onChange={handleStep2Change}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={step2Data.lastName}
                    onChange={handleStep2Change}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={step2Data.email}
                  onChange={handleStep2Change}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <Select
                    id="roleId"
                    name="roleId"
                    value={step2Data.roleId}
                    onChange={handleStep2Change}
                    required
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <Select
                    id="locationId"
                    name="locationId"
                    value={step2Data.locationId}
                    onChange={handleStep2Change}
                    required
                  >
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="daysAvailable" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Available Days
                    <Tooltip content="Current balance of vacation days remaining for this year" />
                  </label>
                  <NumberInput
                    id="daysAvailable"
                    name="daysAvailable"
                    value={step2Data.daysAvailable}
                    onChange={handleStep2Change}
                    min={0}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="hoursAvailable" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Available Hours
                    <Tooltip content="Current balance of time-off hours remaining for this year" />
                  </label>
                  <NumberInput
                    id="hoursAvailable"
                    name="hoursAvailable"
                    value={step2Data.hoursAvailable}
                    onChange={handleStep2Change}
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="annualDays" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Annual Days
                    <Tooltip content="Total number of vacation days granted per year according to contract" />
                  </label>
                  <NumberInput
                    id="annualDays"
                    name="annualDays"
                    value={step2Data.annualDays}
                    onChange={handleStep2Change}
                    min={0}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="annualHours" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    Annual Hours
                    <Tooltip content="Total number of time-off hours granted per year according to contract" />
                  </label>
                  <NumberInput
                    id="annualHours"
                    name="annualHours"
                    value={step2Data.annualHours}
                    onChange={handleStep2Change}
                    min={0}
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Complete Setup'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}