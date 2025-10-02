import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { Calendar, Search, Filter, Eye, Edit, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminAppointments: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [museumFilter, setMuseumFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    const queryClient = useQueryClient();

    const { data: appointmentsData, isLoading } = useQuery(
        ['admin-appointments', currentPage, searchTerm, statusFilter, museumFilter, dateFilter],
        () => {
            const params: any = {
                page: currentPage,
                limit: 20
            };

            // Only add non-empty filters
            if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
            if (statusFilter && statusFilter !== '') params.status = statusFilter;
            if (museumFilter && museumFilter !== '') params.museum = museumFilter;
            if (dateFilter && dateFilter !== '') params.date = dateFilter;

            return adminAPI.getAllAppointments(params);
        },
        {
            refetchOnWindowFocus: false,
            select: (response) => {
                // Admin API returns { success: true, data: { appointments, pagination } }
                // We need to return response.data.data to get { appointments, pagination }
                return response.data.data;
            }
        }
    );

    const updateStatusMutation = useMutation(
        ({ id, status }: { id: string; status: string }) =>
            adminAPI.updateAppointmentStatus(id, status),
        {
            onSuccess: () => {
                toast.success('Appointment status updated successfully');
                queryClient.invalidateQueries('admin-appointments');
                setShowModal(false);
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || 'Failed to update appointment');
            }
        }
    );

    const handleStatusUpdate = (id: string, status: string) => {
        updateStatusMutation.mutate({ id, status });
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


    const appointments = appointmentsData?.appointments || [];
    const pagination = appointmentsData?.pagination;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage and monitor all museum appointments
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

                    <div className="flex items-end space-x-2">
                        <button
                            onClick={clearFilters}
                            className="btn btn-outline btn-md flex-1"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="p-6">
                        <div className="animate-pulse space-y-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                ) : appointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Visitor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Museum
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date & Time
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
                                                    {appointment.visitorEmail}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Ref: {appointment.bookingReference}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {appointment.museum === 'main' ? 'Main Museum' : 'Qin & Han Museum'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {format(new Date(appointment.visitDate), 'MMM dd, yyyy')}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {appointment.timeSlot}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {appointment.numberOfVisitors}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                                {appointment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedAppointment(appointment);
                                                        setShowModal(true);
                                                    }}
                                                    className="text-primary-600 hover:text-primary-900"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {appointment.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Confirm"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {appointment.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Mark as Completed"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
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
                                : 'No appointments have been created yet.'
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

            {/* Appointment Details Modal */}
            {showModal && selectedAppointment && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                            Appointment Details
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Visitor Name</label>
                                                <p className="text-sm text-gray-900">{selectedAppointment.visitorName}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">ID Number</label>
                                                <p className="text-sm text-gray-900">{selectedAppointment.idNumber}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">ID Type</label>
                                                <p className="text-sm text-gray-900">{getIdTypeName(selectedAppointment.idType)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Email</label>
                                                <p className="text-sm text-gray-900">{selectedAppointment.visitorEmail || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Phone</label>
                                                <p className="text-sm text-gray-900">{selectedAppointment.visitorPhone || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Museum</label>
                                                <p className="text-sm text-gray-900">
                                                    {selectedAppointment.museum === 'main' ? 'Main Museum' : 'Qin & Han Museum'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Date & Time</label>
                                                <p className="text-sm text-gray-900">
                                                    {format(new Date(selectedAppointment.visitDate), 'MMMM dd, yyyy')} at {selectedAppointment.timeSlot}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Number of Visitors</label>
                                                <p className="text-sm text-gray-900">{selectedAppointment.numberOfVisitors}</p>
                                            </div>
                                            {selectedAppointment.visitorDetails && selectedAppointment.visitorDetails.length > 0 && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Visitor Details</label>
                                                    <div className="mt-2 space-y-2">
                                                        {selectedAppointment.visitorDetails.map((visitor: any, index: number) => (
                                                            <div key={index} className="bg-gray-50 p-3 rounded-md">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {index + 1}. {visitor.name}
                                                                </div>
                                                                <div className="text-xs text-gray-600 mt-1">
                                                                    <div>ID: {visitor.idNumber}</div>
                                                                    <div>Type: {getIdTypeName(visitor.idType)}</div>
                                                                    {visitor.age && <div>Age: {visitor.age}</div>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Status</label>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                                                    {selectedAppointment.status}
                                                </span>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Booking Reference</label>
                                                <p className="text-sm text-gray-900">{selectedAppointment.bookingReference}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAppointments;
