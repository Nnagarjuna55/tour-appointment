import React from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { adminAPI } from '../../services/api';
import { Calendar, Users, Building, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, MapPin, User, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const AdminDashboard: React.FC = () => {
    const queryClient = useQueryClient();

    const { data: stats, isLoading, error } = useQuery(
        'admin-dashboard-stats',
        adminAPI.getDashboardStats,
        {
            refetchOnWindowFocus: false,
            refetchInterval: 10000, // Refresh every 10 seconds for debugging
            staleTime: 0, // Always consider data stale
            cacheTime: 0, // Don't cache data
            onSuccess: (data) => {
                console.log('=== DASHBOARD STATS DEBUG ===');
                console.log('Full response:', data);
                console.log('Response.data:', data?.data);
                console.log('Response.data.data:', data?.data?.data);
                console.log('Trying data?.data?.totalAppointments:', data?.data?.totalAppointments);
                console.log('Trying data?.data?.data?.totalAppointments:', data?.data?.data?.totalAppointments);
                console.log('Full data structure:', JSON.stringify(data?.data, null, 2));
            },
            onError: (error) => {
                console.error('Dashboard stats error:', error);
            }
        }
    );

    const { data: recentAppointments, isLoading: appointmentsLoading } = useQuery(
        'recent-appointments',
        () => adminAPI.getAllAppointments({ page: 1, limit: 5 }),
        {
            select: (response) => response.data.appointments
        }
    );

    const refreshDashboard = () => {
        console.log('=== MANUALLY REFRESHING DASHBOARD ===');
        queryClient.invalidateQueries('admin-dashboard-stats');
        queryClient.invalidateQueries('recent-appointments');
        // Force refetch
        queryClient.refetchQueries('admin-dashboard-stats');
    };


    const statCards = [
        {
            name: 'Total Appointments',
            value: stats?.data?.data?.totalAppointments || 0,
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            name: 'Today\'s Appointments',
            value: stats?.data?.data?.todayAppointments || 0,
            icon: Clock,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            name: 'Confirmed',
            value: stats?.data?.data?.statusBreakdown?.confirmed || 0,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100'
        },
        {
            name: 'Pending',
            value: stats?.data?.data?.statusBreakdown?.pending || 0,
            icon: AlertCircle,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
        },
        {
            name: 'Cancelled',
            value: stats?.data?.data?.statusBreakdown?.cancelled || 0,
            icon: XCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-100'
        },
        {
            name: 'Main Museum',
            value: stats?.data?.data?.museumBreakdown?.main || 0,
            icon: Building,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            name: 'Qin & Han Museum',
            value: stats?.data?.data?.museumBreakdown?.qin_han || 0,
            icon: Building,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-100'
        }
    ];

    // Debug what values the stat cards are getting
    console.log('=== STAT CARDS DEBUG ===');
    console.log('stats object:', stats);
    console.log('stats?.data:', stats?.data);
    console.log('stats?.data?.data:', stats?.data?.data);
    statCards.forEach((card, i) => {
        console.log(`${card.name}: ${card.value}`);
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Overview of the museum booking system
                    </p>
                    {error ? (
                        <div className="mt-2 text-sm text-red-600">
                            Error loading stats: {(error as any)?.message || 'Unknown error'}
                        </div>
                    ) : null}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={refreshDashboard}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className={`h-8 w-8 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                                            <Icon className={`h-5 w-5 ${stat.color}`} />
                                        </div>
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {stat.name}
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-900">
                                                {isLoading ? (
                                                    <div className="animate-pulse h-6 bg-gray-200 rounded w-12"></div>
                                                ) : (
                                                    stat.value
                                                )}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Quick Actions
                        </h3>
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <a
                                href="/admin/booking"
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Create Booking
                            </a>
                            <a
                                href="/admin/appointments"
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                Manage Appointments
                            </a>
                            <a
                                href="/admin/users"
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <Users className="mr-2 h-4 w-4" />
                                User Management
                            </a>
                            <a
                                href="/admin/museum-config"
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <Building className="mr-2 h-4 w-4" />
                                Museum Settings
                            </a>
                            <a
                                href="/admin/appointments"
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                <TrendingUp className="mr-2 h-4 w-4" />
                                View Reports
                            </a>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            System Status
                        </h3>
                        <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Database Connection</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Online
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">API Status</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Healthy
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Last Backup</span>
                                <span className="text-sm text-gray-900">
                                    {new Date().toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Appointments */}
            <div className="mt-8">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Recent Appointments
                            </h3>
                            <a
                                href="/admin/appointments"
                                className="text-sm text-primary-600 hover:text-primary-500"
                            >
                                View all →
                            </a>
                        </div>

                        {appointmentsLoading ? (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                <p className="mt-2 text-sm text-gray-500">Loading appointments...</p>
                            </div>
                        ) : recentAppointments && recentAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {recentAppointments.map((appointment: any) => (
                                    <div key={appointment._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-primary-600" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {appointment.visitorName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {appointment.bookingReference}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {format(new Date(appointment.visitDate), 'MMM dd, yyyy')}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {appointment.timeSlot}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-500">
                                                        {appointment.museum === 'main' ? 'Main Museum' : 'Qin & Han Museum'}
                                                    </span>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appointment.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : appointment.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : appointment.status === 'cancelled'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {appointment.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new appointment.</p>
                                <div className="mt-6">
                                    <a
                                        href="/admin/booking"
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                                    >
                                        Create Booking
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminDashboard;
