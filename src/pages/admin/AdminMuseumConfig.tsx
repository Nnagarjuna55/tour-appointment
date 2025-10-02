import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { Building, Plus, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminMuseumConfig: React.FC = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState<any>(null);
    const [createForm, setCreateForm] = useState<{
        museum: string;
        name: string;
        address: string;
        maxDailyCapacity: number;
        extendedCapacity: number;
        specialPeriodCapacity: number;
        regularTimeSlots: string[];
        extendedTimeSlots: string[];
        specialPeriodTimeSlots: string[];
        regularPeriod: { start: string; end: string };
        extendedPeriod: { start: string; end: string };
        specialPeriod: { start: string; end: string };
        bookingAdvanceDays: number;
        ticketReleaseTime: string;
        isActive: boolean;
    }>({
        museum: 'main',
        name: '',
        address: '',
        maxDailyCapacity: 12000,
        extendedCapacity: 14000,
        specialPeriodCapacity: 17500,
        regularTimeSlots: ['8:30-10:30', '10:30-12:30', '12:30-14:30', '14:30-16:30', '16:30-18:00'],
        extendedTimeSlots: ['8:30-10:30', '10:30-12:30', '12:30-14:30', '14:30-16:30', '16:30-18:00'],
        specialPeriodTimeSlots: ['7:30-9:30', '9:30-11:30', '11:30-13:30', '13:30-15:30', '15:30-17:30', '17:30-19:30'],
        regularPeriod: { start: '01-01', end: '12-31' },
        extendedPeriod: { start: '04-01', end: '10-31' },
        specialPeriod: { start: '10-01', end: '10-08' },
        bookingAdvanceDays: 5,
        ticketReleaseTime: '17:00',
        isActive: true
    });
    const [editForm, setEditForm] = useState<{
        name: string;
        address: string;
        maxDailyCapacity: number;
        extendedCapacity: number;
        specialPeriodCapacity: number;
        regularTimeSlots: string[];
        extendedTimeSlots: string[];
        specialPeriodTimeSlots: string[];
        regularPeriod: { start: string; end: string };
        extendedPeriod: { start: string; end: string };
        specialPeriod: { start: string; end: string };
        bookingAdvanceDays: number;
        ticketReleaseTime: string;
        isActive: boolean;
    }>({
        name: '',
        address: '',
        maxDailyCapacity: 12000,
        extendedCapacity: 14000,
        specialPeriodCapacity: 17500,
        regularTimeSlots: [],
        extendedTimeSlots: [],
        specialPeriodTimeSlots: [],
        regularPeriod: { start: '01-01', end: '12-31' },
        extendedPeriod: { start: '04-01', end: '10-31' },
        specialPeriod: { start: '10-01', end: '10-08' },
        bookingAdvanceDays: 5,
        ticketReleaseTime: '17:00',
        isActive: true
    });

    const queryClient = useQueryClient();

    const { data: configs, isLoading } = useQuery(
        'museum-configs',
        adminAPI.getMuseumConfigs
    );

    const createConfigMutation = useMutation(adminAPI.createMuseumConfig, {
        onSuccess: () => {
            toast.success('Museum configuration created successfully');
            queryClient.invalidateQueries('museum-configs');
            setShowCreateModal(false);
            resetCreateForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create configuration');
        }
    });

    const updateConfigMutation = useMutation(
        ({ id, data }: { id: string; data: any }) => adminAPI.updateMuseumConfig(id, data),
        {
            onSuccess: () => {
                toast.success('Museum configuration updated successfully');
                queryClient.invalidateQueries('museum-configs');
                setShowEditModal(false);
                setSelectedConfig(null);
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || 'Failed to update configuration');
            }
        }
    );

    const resetCreateForm = () => {
        setCreateForm({
            museum: 'main',
            name: '',
            address: '',
            maxDailyCapacity: 12000,
            extendedCapacity: 14000,
            specialPeriodCapacity: 17500,
            regularTimeSlots: ['8:30-10:30', '10:30-12:30', '12:30-14:30', '14:30-16:30', '16:30-18:00'],
            extendedTimeSlots: ['8:30-10:30', '10:30-12:30', '12:30-14:30', '14:30-16:30', '16:30-18:00'],
            specialPeriodTimeSlots: ['7:30-9:30', '9:30-11:30', '11:30-13:30', '13:30-15:30', '15:30-17:30', '17:30-19:30'],
            regularPeriod: { start: '01-01', end: '12-31' },
            extendedPeriod: { start: '04-01', end: '10-31' },
            specialPeriod: { start: '10-01', end: '10-08' },
            bookingAdvanceDays: 5,
            ticketReleaseTime: '17:00',
            isActive: true
        });
    };

    const handleCreateConfig = (e: React.FormEvent) => {
        e.preventDefault();
        createConfigMutation.mutate(createForm);
    };

    const handleEditConfig = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedConfig) {
            updateConfigMutation.mutate({ id: selectedConfig._id, data: editForm });
        }
    };

    const openEditModal = (config: any) => {
        setSelectedConfig(config);
        setEditForm({
            name: config.name,
            address: config.address,
            maxDailyCapacity: config.maxDailyCapacity,
            extendedCapacity: config.extendedCapacity,
            specialPeriodCapacity: config.specialPeriodCapacity,
            regularTimeSlots: config.regularTimeSlots,
            extendedTimeSlots: config.extendedTimeSlots,
            specialPeriodTimeSlots: config.specialPeriodTimeSlots,
            regularPeriod: config.regularPeriod,
            extendedPeriod: config.extendedPeriod,
            specialPeriod: config.specialPeriod,
            bookingAdvanceDays: config.bookingAdvanceDays,
            ticketReleaseTime: config.ticketReleaseTime,
            isActive: config.isActive
        });
        setShowEditModal(true);
    };

    // const addTimeSlot = (type: string, form: any, setForm: any) => {
    //     const newSlot = '';
    //     if (type === 'regular') {
    //         setForm({ ...form, regularTimeSlots: [...form.regularTimeSlots, newSlot] });
    //     } else if (type === 'extended') {
    //         setForm({ ...form, extendedTimeSlots: [...form.extendedTimeSlots, newSlot] });
    //     } else if (type === 'special') {
    //         setForm({ ...form, specialPeriodTimeSlots: [...form.specialPeriodTimeSlots, newSlot] });
    //     }
    // };

    // const removeTimeSlot = (type: string, index: number, form: any, setForm: any) => {
    //     if (type === 'regular') {
    //         setForm({ ...form, regularTimeSlots: form.regularTimeSlots.filter((_: any, i: number) => i !== index) });
    //     } else if (type === 'extended') {
    //         setForm({ ...form, extendedTimeSlots: form.extendedTimeSlots.filter((_: any, i: number) => i !== index) });
    //     } else if (type === 'special') {
    //         setForm({ ...form, specialPeriodTimeSlots: form.specialPeriodTimeSlots.filter((_: any, i: number) => i !== index) });
    //     }
    // };

    // const updateTimeSlot = (type: string, index: number, value: string, form: any, setForm: any) => {
    //     if (type === 'regular') {
    //         const newSlots = [...form.regularTimeSlots];
    //         newSlots[index] = value;
    //         setForm({ ...form, regularTimeSlots: newSlots });
    //     } else if (type === 'extended') {
    //         const newSlots = [...form.extendedTimeSlots];
    //         newSlots[index] = value;
    //         setForm({ ...form, extendedTimeSlots: newSlots });
    //     } else if (type === 'special') {
    //         const newSlots = [...form.specialPeriodTimeSlots];
    //         newSlots[index] = value;
    //         setForm({ ...form, specialPeriodTimeSlots: newSlots });
    //     }
    // };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Museum Configuration</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage museum settings and capacity limits
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary btn-md"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Configuration
                </button>
            </div>

            {/* Museum Configurations */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {isLoading ? (
                    [...Array(2)].map((_, i) => (
                        <div key={i} className="bg-white shadow rounded-lg p-6">
                            <div className="animate-pulse space-y-4">
                                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))
                ) : configs?.data && configs.data.length > 0 ? (
                    configs.data.map((config: any) => (
                        <div key={config._id} className="bg-white shadow rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <Building className="h-8 w-8 text-primary-600 mr-3" />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">
                                            {config.name}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {config.museum === 'main' ? 'Main Museum' : 'Qin & Han Museum'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openEditModal(config)}
                                    className="text-primary-600 hover:text-primary-900"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Address:</span>
                                    <p className="text-sm text-gray-900">{config.address}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Regular Capacity:</span>
                                        <p className="text-sm text-gray-900">{config.maxDailyCapacity.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-500">Extended Capacity:</span>
                                        <p className="text-sm text-gray-900">{config.extendedCapacity?.toLocaleString() || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Booking Advance:</span>
                                    <p className="text-sm text-gray-900">{config.bookingAdvanceDays} days</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Ticket Release Time:</span>
                                    <p className="text-sm text-gray-900">{config.ticketReleaseTime}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">Status:</span>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {config.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-12">
                        <Building className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No configurations found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Get started by creating your first museum configuration.
                        </p>
                    </div>
                )}
            </div>

            {/* Create Configuration Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <form onSubmit={handleCreateConfig}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                Create Museum Configuration
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Museum *
                                                    </label>
                                                    <select
                                                        required
                                                        className="mt-1 input"
                                                        value={createForm.museum}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, museum: e.target.value }))}
                                                    >
                                                        <option value="main">Main Museum</option>
                                                        <option value="qin_han">Qin & Han Museum</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="mt-1 input"
                                                        value={createForm.name}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Address *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="mt-1 input"
                                                        value={createForm.address}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Regular Capacity *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="mt-1 input"
                                                        value={createForm.maxDailyCapacity}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, maxDailyCapacity: parseInt(e.target.value) }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Extended Capacity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="mt-1 input"
                                                        value={createForm.extendedCapacity}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, extendedCapacity: parseInt(e.target.value) }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Special Period Capacity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="mt-1 input"
                                                        value={createForm.specialPeriodCapacity}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, specialPeriodCapacity: parseInt(e.target.value) }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Booking Advance Days *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="mt-1 input"
                                                        value={createForm.bookingAdvanceDays}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, bookingAdvanceDays: parseInt(e.target.value) }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Ticket Release Time *
                                                    </label>
                                                    <input
                                                        type="time"
                                                        required
                                                        className="mt-1 input"
                                                        value={createForm.ticketReleaseTime}
                                                        onChange={(e) => setCreateForm(prev => ({ ...prev, ticketReleaseTime: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
                                                    <label className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                            checked={createForm.isActive}
                                                            onChange={(e) => setCreateForm(prev => ({ ...prev, isActive: e.target.checked }))}
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
                                        disabled={createConfigMutation.isLoading}
                                        className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {createConfigMutation.isLoading ? 'Creating...' : 'Create Configuration'}
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

            {/* Edit Configuration Modal */}
            {showEditModal && selectedConfig && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                            <form onSubmit={handleEditConfig}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                Edit Museum Configuration
                                            </h3>
                                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="mt-1 input"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Address *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="mt-1 input"
                                                        value={editForm.address}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Regular Capacity *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="mt-1 input"
                                                        value={editForm.maxDailyCapacity}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, maxDailyCapacity: parseInt(e.target.value) }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Extended Capacity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="mt-1 input"
                                                        value={editForm.extendedCapacity}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, extendedCapacity: parseInt(e.target.value) }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Special Period Capacity
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="mt-1 input"
                                                        value={editForm.specialPeriodCapacity}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, specialPeriodCapacity: parseInt(e.target.value) }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Booking Advance Days *
                                                    </label>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="mt-1 input"
                                                        value={editForm.bookingAdvanceDays}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, bookingAdvanceDays: parseInt(e.target.value) }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Ticket Release Time *
                                                    </label>
                                                    <input
                                                        type="time"
                                                        required
                                                        className="mt-1 input"
                                                        value={editForm.ticketReleaseTime}
                                                        onChange={(e) => setEditForm(prev => ({ ...prev, ticketReleaseTime: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="sm:col-span-2">
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
                                        disabled={updateConfigMutation.isLoading}
                                        className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {updateConfigMutation.isLoading ? 'Updating...' : 'Update Configuration'}
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

export default AdminMuseumConfig;
