import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { getRoles, createRole, updateRole, deleteRole } from '@/lib/db/roles';
import { useAuthStore } from '@/store/auth';
import { Role } from '@/types';
import { Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react';

export function RolesPage() {
  const { user } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');

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

    loadRoles();
  }, [user]);

  async function loadRoles() {
    if (!user?.organizationId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedRoles = await getRoles(user.organizationId);
      setRoles(fetchedRoles);
    } catch (err: any) {
      console.error('Error loading roles:', err);
      setError(err.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setRoleName('');
    setError(null);
    setIsAddModalOpen(true);
  }

  async function handleAddRole() {
    if (!user?.id || !user.organizationId) return;
    
    try {
      setError(null);
      await createRole(roleName.trim(), user.organizationId, user.id);
      await loadRoles();
      setIsAddModalOpen(false);
      setRoleName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
    }
  }

  async function handleEditRole() {
    if (!selectedRole || !user?.organizationId) return;
    
    try {
      setError(null);
      await updateRole(selectedRole.id, roleName.trim(), user.organizationId);
      await loadRoles();
      setIsEditModalOpen(false);
      setSelectedRole(null);
      setRoleName('');
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    }
  }

  async function handleDeleteRole() {
    if (!selectedRole || !user?.organizationId) return;
    
    try {
      setError(null);
      await deleteRole(selectedRole.id, user.organizationId);
      await loadRoles();
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
  }

  function openEditModal(role: Role) {
    setSelectedRole(role);
    setRoleName(role.name);
    setError(null);
    setIsEditModalOpen(true);
  }

  function openDeleteModal(role: Role) {
    setSelectedRole(role);
    setError(null);
    setIsDeleteModalOpen(true);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Roles</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage roles for your organization
            </p>
          </div>
          
          <Button
            onClick={openAddModal}
            className="flex items-center transition-transform duration-200 hover:scale-105"
            disabled={loading || !!error}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Role
          </Button>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading roles...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      {format(role.createdAt.toDate(), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(role)}
                        className="hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteModal(role)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {roles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      No roles found. Click "Add New Role" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Role Modal */}
        <Dialog 
          open={isAddModalOpen} 
          onClose={() => {
            setIsAddModalOpen(false);
            setRoleName('');
            setError(null);
          }}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
              <DialogDescription>
                Enter a name for the new role
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <Input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Role name"
                className="transition-shadow duration-200 focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setRoleName('');
                  setError(null);
                }}
                className="transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddRole}
                disabled={!roleName.trim()}
                className="transition-transform duration-200 hover:scale-105"
              >
                Add Role
              </Button>
            </DialogFooter>
          </div>
        </Dialog>

        {/* Edit Role Modal */}
        <Dialog 
          open={isEditModalOpen} 
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRole(null);
            setRoleName('');
            setError(null);
          }}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update the role name
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-4">
              <Input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="Role name"
                className="transition-shadow duration-200 focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedRole(null);
                  setRoleName('');
                  setError(null);
                }}
                className="transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditRole}
                disabled={!roleName.trim()}
                className="transition-transform duration-200 hover:scale-105"
              >
                Update Role
              </Button>
            </DialogFooter>
          </div>
        </Dialog>

        {/* Delete Role Modal */}
        <Dialog 
          open={isDeleteModalOpen} 
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedRole(null);
            setError(null);
          }}
        >
          <div className="p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-bounce">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            
            <DialogHeader>
              <DialogTitle className="text-center">Delete Role</DialogTitle>
              <DialogDescription className="text-center">
                Are you sure you want to delete this role? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="mt-6 justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedRole(null);
                  setError(null);
                }}
                className="min-w-[100px] transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteRole}
                className="min-w-[100px] bg-red-600 hover:bg-red-700 transition-all duration-200 hover:scale-105"
              >
                Delete
              </Button>
            </DialogFooter>
          </div>
        </Dialog>
      </div>
    </AdminLayout>
  );
}