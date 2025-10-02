import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { Users, Search, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [createForm, setCreateForm] = useState({
        email: '',
        password: '',
        role: 'user'
    });
    const [editForm, setEditForm] = useState({
        email: '',
        role: 'user',
        isActive: true
    });

    const queryClient = useQueryClient();

    const { data: usersData, isLoading } = useQuery(
        ['admin-users', currentPage, searchTerm, roleFilter],
        () => adminAPI.getUsers({
            page: currentPage,
            limit: 20,
            search: searchTerm,
            role: roleFilter
        })
    );

    const createUserMutation = useMutation(adminAPI.createUser, {
        onSuccess: () => {
            toast.success('User created successfully');
            queryClient.invalidateQueries('admin-users');
            setShowCreateModal(false);
            setCreateForm({ email: '', password: '', role: 'user' });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    });

    const updateUserMutation = useMutation(
        ({ id, data }: { id: string; data: any }) => adminAPI.updateUser(id, data),
        {
            onSuccess: () => {
                toast.success('User updated successfully');
                queryClient.invalidateQueries('admin-users');
                setShowEditModal(false);
                setSelectedUser(null);
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || 'Failed to update user');
            }
        }
    );

    const deleteUserMutation = useMutation(adminAPI.deleteUser, {
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries('admin-users');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    });

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        createUserMutation.mutate(createForm);
    };

    const handleEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUser) {
            updateUserMutation.mutate({ id: selectedUser._id, data: editForm });
        }
    };

    const handleDeleteUser = (id: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            deleteUserMutation.mutate(id);
        }
    };

    const openEditModal = (user: any) => {
        setSelectedUser(user);
        setEditForm({
            email: user.email,
            role: user.role,
            isActive: user.isActive
        });
        setShowEditModal(true);
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'user':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (isActive: boolean) => {
        return isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    };

    const clearFilters = () => {
        setSearchTerm('');
        setRoleFilter('');
        setCurrentPage(1);
    };

    const users = usersData?.data?.users || [];
    const pagination = usersData?.data?.pagination;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage system users and their permissions
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary btn-md"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="input pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <select
                            className="input"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="btn btn-outline btn-md w-full"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-6">
                        <div className="animate-pulse space-y-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                ) : users.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user: any) => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-primary-600">
                                                            {user.email.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.email}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {user._id.slice(-8)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="text-primary-600 hover:text-primary-900"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || roleFilter
                                ? 'Try adjusting your search criteria.'
                                : 'No users have been created yet.'
                            }
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                                disabled={currentPage === pagination.pages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing{' '}
                                    <span className="font-medium">
                                        {(currentPage - 1) * 20 + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * 20, pagination.total)}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-medium">{pagination.total}</span>{' '}
                                    results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(pagination.pages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                                                ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                                        disabled={currentPage === pagination.pages}
                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleCreateUser}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                Create New User
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Email Address *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        required
                                                        className="mt-1 input"
                                                        value={createForm.email}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Password *
                                                    </label>
                                                    <input
                                                        type="password"
                                                        required
                                                        className="mt-1 input"
                                                        value={createForm.password}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Role *
                                                    </label>
                                                    <select
                                                        required
                                                        className="mt-1 input"
                                                        value={createForm.role}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={createUserMutation.isLoading}
                                        className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {createUserMutation.isLoading ? 'Creating...' : 'Create User'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleEditUser}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                Edit User
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Email Address *
                                                    </label>
                                                    <input
                                                        type="email"
                                                        required
                                                        className="mt-1 input"
                                                        value={editForm.email}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Role *
                                                    </label>
                                                    <select
                                                        required
                                                        className="mt-1 input"
                                                        value={editForm.role}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                            checked={editForm.isActive}
                                                            onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                                                        />
                                                        <span className="ml-2 text-sm text-gray-700">Active</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={updateUserMutation.isLoading}
                                        className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updateUserMutation.isLoading ? 'Updating...' : 'Update User'}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
