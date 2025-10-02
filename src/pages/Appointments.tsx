import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { appointmentAPI, adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, MapPin, Users, Search, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Appointments: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [museumFilter, setMuseumFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const queryClient = useQueryClient();

    const { data: appointmentsData, isLoading } = useQuery(
        ['appointments', currentPage, searchTerm, statusFilter, museumFilter, dateFilter],
        () => {
            const params: any = {
                page: currentPage,
                limit: 10
            };

            // Only add filters if they have values
            if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
            if (statusFilter && statusFilter !== '') params.status = statusFilter;
            if (museumFilter && museumFilter !== '') params.museum = museumFilter;
            if (dateFilter && dateFilter !== '') params.date = dateFilter;


            // Use admin API if user is admin, otherwise use regular API
            return isAdmin
                ? adminAPI.getAllAppointments(params)
                : appointmentAPI.getAppointments(params);
        },
        {
            select: (response) => {
                // Handle different response structures
                if (isAdmin) {
                    // Admin API returns { success: true, data: { appointments, pagination } }
                    // We need to return response.data.data to get { appointments, pagination }
                    return response.data.data;
                } else {
                    // Regular API structure
                    return response.data;
                }
            },
        }
    );

    const cancelAppointmentMutation = useMutation(
        (id: string) => appointmentAPI.cancelAppointment(id),
        {
            onSuccess: () => {
                toast.success('Appointment cancelled successfully');
                queryClient.invalidateQueries('appointments');
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || 'Failed to cancel appointment');
            }
        }
    );

    const handleCancel = (id: string) => {
        if (window.confirm('Are you sure you want to cancel this appointment?')) {
            cancelAppointmentMutation.mutate(id);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getIdTypeName = (idType: string) => {
        switch (idType) {
            case 'id_card':
                return 'Identity card of the People\'s Republic of China';
            case 'hk_macau_passport':
                return 'Passport for Hong Kong and Macao residents to and from the Mainland';
            case 'taiwan_permit':
                return 'Taiwan residents travel permits to and from the mainland';
            case 'passport':
                return 'PASSPORT';
            case 'foreign_id':
                return 'Permanent residence identity card for foreigners of the People\'s Republic of China';
            default:
                return idType;
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setMuseumFilter('');
        setDateFilter('');
        setCurrentPage(1);
    };

    // Now appointmentsData should have the correct structure: { appointments, pagination }
    const appointments = appointmentsData?.appointments || [];
    const pagination = appointmentsData?.pagination;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isAdmin ? 'All Appointments' : 'My Appointments'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    {isAdmin ? 'Manage all museum visit appointments' : 'Manage your museum visit appointments'}
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search appointments..."
                                className="input pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            className="input"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Museum
                        </label>
                        <select
                            className="input"
                            value={museumFilter}
                            onChange={(e) => setMuseumFilter(e.target.value)}
                        >
                            <option value="">All Museums</option>
                            <option value="main">Main Museum</option>
                            <option value="qin_han">Qin & Han Museum</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            className="input"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={clearFilters}
                            className="btn btn-outline btn-md w-full"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Clear
                        </button>
                    </div>
                </div>
            </div>


            {/* Appointments List */}
            <div className="bg-white shadow rounded-lg">
                {isLoading ? (
                    <div className="p-6">
                        <div className="animate-pulse space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-20 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                ) : appointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Booking Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Visit Information
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Visitors
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {appointments.map((appointment: any) => (
                                    <tr key={appointment._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {appointment.visitorName}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {appointment.bookingReference}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    ID: {appointment.idNumber}
                                                </div>
                                                {appointment.visitorEmail && (
                                                    <div className="text-xs text-gray-400">
                                                        Email: {appointment.visitorEmail}
                                                    </div>
                                                )}
                                                {appointment.visitorPhone && (
                                                    <div className="text-xs text-gray-400">
                                                        Phone: {appointment.visitorPhone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm text-gray-900">
                                                    {appointment.museum === 'main' ? 'Shaanxi History Museum' : 'Qin & Han Dynasties Museum'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {format(new Date(appointment.visitDate), 'MMM dd, yyyy')}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {appointment.timeSlot}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {appointment.numberOfVisitors} visitor{appointment.numberOfVisitors > 1 ? 's' : ''}
                                            </div>
                                            {appointment.visitorDetails && appointment.visitorDetails.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {appointment.visitorDetails.map((visitor: any, index: number) => (
                                                        <div key={index} className="text-xs text-gray-500 border-l-2 border-gray-200 pl-2">
                                                            <div className="font-medium">{visitor.name}</div>
                                                            <div>ID: {visitor.idNumber}</div>
                                                            <div>Type: {getIdTypeName(visitor.idType)}</div>
                                                            {visitor.age && <div>Age: {visitor.age}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                                {appointment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                {appointment.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleCancel(appointment._id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                                <button className="text-primary-600 hover:text-primary-800">
                                                    View Details
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
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || statusFilter || museumFilter || dateFilter
                                ? 'Try adjusting your search criteria.'
                                : 'Get started by booking your first appointment.'
                            }
                        </p>
                        {!searchTerm && !statusFilter && !museumFilter && !dateFilter && (
                            <div className="mt-6">
                                <p className="text-sm text-gray-500 mb-4">Contact admin to book an appointment</p>
                                <a
                                    href="/admin/booking"
                                    className="btn btn-primary btn-md"
                                >
                                    Admin: Create Booking
                                </a>
                            </div>
                        )}
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
                                        {(currentPage - 1) * 10 + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium">
                                        {Math.min(currentPage * 10, pagination.total)}
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
        </div>
    );
};

export default Appointments;
