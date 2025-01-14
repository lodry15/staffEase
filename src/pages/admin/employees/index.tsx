import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { EmployeeForm } from '@/components/employees/employee-form';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Employee, CreateEmployeeData, UpdateEmployeeData } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { createEmployee, getEmployees, updateEmployee, deleteEmployee } from '@/lib/db/employees';

export function EmployeesPage() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (!user) {
      setError('Please wait while we load your data...');
      setLoading(false);
      return;
    }

    if (!user.organizationId) {
      setError('Organization data not found. Please try logging in again.');
      setLoading(false);
      return;
    }

    loadEmployees();
  }, [user]);

  async function loadEmployees() {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedEmployees = await getEmployees(user.organizationId);
      setEmployees(fetchedEmployees);
    } catch (err: any) {
      console.error('Error loading employees:', err);
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setFormData(null);
    setFormError(null);
    setIsFormValid(false);
    setIsAddModalOpen(true);
  }

  function openEditModal(employee: Employee) {
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      roleId: employee.roleId.id,
      locationId: employee.locationId.id,
      daysAvailable: employee.daysAvailable,
      hoursAvailable: employee.hoursAvailable,
      annualDays: employee.annualDays,
      annualHours: employee.annualHours,
    });
    setFormError(null);
    setIsFormValid(true);
    setIsEditModalOpen(true);
  }

  function openDeleteModal(employee: Employee) {
    setSelectedEmployee(employee);
    setFormError(null);
    setIsDeleteModalOpen(true);
  }

  const handleFormChange = (data: any, isValid: boolean) => {
    setFormData(data);
    setIsFormValid(isValid);
  };

  async function handleAddEmployee() {
    if (!user?.id || !user.organizationId || !formData || !isFormValid) return;
    
    try {
      setFormError(null);
      await createEmployee({
        ...formData,
        organizationId: user.organizationId
      }, user.id);
      await loadEmployees();
      setIsAddModalOpen(false);
      setFormData(null);
      setIsFormValid(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create employee');
    }
  }

  async function handleEditEmployee() {
    if (!selectedEmployee || !user?.organizationId || !formData || !isFormValid) return;
    
    try {
      setFormError(null);
      await updateEmployee(selectedEmployee.id, formData);
      await loadEmployees();
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      setFormData(null);
      setIsFormValid(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update employee');
    }
  }

  async function handleDeleteEmployee() {
    if (!selectedEmployee || !user?.organizationId) return;
    
    try {
      setFormError(null);
      await deleteEmployee(selectedEmployee.id, user.organizationId);
      await loadEmployees();
      setIsDeleteModalOpen(false);
      setSelectedEmployee(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete employee');
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage employees in your organization
            </p>
          </div>
          
          <Button
            onClick={openAddModal}
            className="flex items-center transition-transform duration-200 hover:scale-105"
            disabled={loading || !!error}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Employee
          </Button>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading employees...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.firstName}</TableCell>
                    <TableCell>{employee.lastName}</TableCell>
                    <TableCell>{employee.roleName}</TableCell>
                    <TableCell>{employee.locationName}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(employee)}
                        className="hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(employee)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No employees found. Click "Add New Employee" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Employee Modal */}
        <Dialog 
          open={isAddModalOpen} 
          onClose={() => {
            setIsAddModalOpen(false);
            setFormData(null);
            setFormError(null);
            setIsFormValid(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Enter the employee details
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <EmployeeForm
              onChange={handleFormChange}
              error={formError}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setFormData(null);
                setFormError(null);
                setIsFormValid(false);
              }}
              className="transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddEmployee}
              disabled={!isFormValid}
              className="transition-transform duration-200 hover:scale-105"
            >
              Add Employee
            </Button>
          </DialogFooter>
        </Dialog>

        {/* Edit Employee Modal */}
        <Dialog 
          open={isEditModalOpen} 
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEmployee(null);
            setFormData(null);
            setFormError(null);
            setIsFormValid(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee details
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <EmployeeForm
              initialData={formData}
              isEditing={true}
              onChange={handleFormChange}
              error={formError}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedEmployee(null);
                setFormData(null);
                setFormError(null);
                setIsFormValid(false);
              }}
              className="transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditEmployee}
              disabled={!isFormValid}
              className="transition-transform duration-200 hover:scale-105"
            >
              Update Employee
            </Button>
          </DialogFooter>
        </Dialog>

        {/* Delete Employee Modal */}
        <Dialog 
          open={isDeleteModalOpen} 
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedEmployee(null);
            setFormError(null);
          }}
        >
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-bounce">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          
          <DialogHeader>
            <DialogTitle className="text-center">Delete Employee</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete this employee? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedEmployee(null);
                setFormError(null);
              }}
              className="min-w-[100px] transition-colors duration-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteEmployee}
              className="min-w-[100px] bg-red-600 hover:bg-red-700 transition-all duration-200 hover:scale-105"
            >
              Delete
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    </AdminLayout>
  );
}