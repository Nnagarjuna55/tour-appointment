import React from 'react';
import { useQuery } from 'react-query';
import { appointmentAPI, adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Use admin API if user is admin, otherwise use regular appointments
    const { data: appointments, isLoading } = useQuery(
        'my-appointments',
        () => isAdmin
            ? adminAPI.getAllAppointments({ limit: 5 })
            : appointmentAPI.getAppointments({ limit: 5 }),
        {
            select: (response) => response.data.appointments
        }
    );

    const upcomingAppointments = appointments?.filter(
        (apt: any) => new Date(apt.visitDate) >= new Date() && apt.status !== 'cancelled'
    ) || [];

    // const recentAppointments = appointments?.slice(0, 3) || [];

    // Get admin stats if user is admin
    const { data: adminStats } = useQuery(
        'dashboard-admin-stats',
        adminAPI.getDashboardStats,
        {
            enabled: isAdmin,
            staleTime: 0, // Always consider data stale
            cacheTime: 0, // Don't cache data
            refetchInterval: 10000, // Refresh every 10 seconds
            onSuccess: (data) => {
                console.log('=== REGULAR DASHBOARD ADMIN STATS ===');
                console.log('Full response:', data);
                console.log('Response.data:', data?.data);
                console.log('Response.data.data:', data?.data?.data);
                console.log('Total appointments:', data?.data?.data?.totalAppointments);
                console.log('Confirmed:', data?.data?.data?.statusBreakdown?.confirmed);
            }
        }
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Welcome to the Shaanxi History Museum booking system
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Calendar className="h-6 w-6 text-primary-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Upcoming Appointments
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {isAdmin ? (adminStats?.data?.data?.upcomingAppointments || 0) : upcomingAppointments.length}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Confirmed
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {isAdmin ? (adminStats?.data?.data?.statusBreakdown?.confirmed || 0) : (appointments?.filter((apt: any) => apt.status === 'confirmed').length || 0)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <MapPin className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Main Museum
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {isAdmin ? (adminStats?.data?.data?.museumBreakdown?.main || 0) : (appointments?.filter((apt: any) => apt.museum === 'main').length || 0)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Visitors
                                    </dt>
                                    <dd className="text-lg font-medium text-gray-900">
                                        {isAdmin ? (adminStats?.data?.data?.totalAppointments || 0) : (appointments?.reduce((sum: number, apt: any) => sum + apt.numberOfVisitors, 0) || 0)}
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Upcoming Appointments
                    </h3>
                    <div className="mt-5">
                        {isLoading ? (
                            <div className="animate-pulse space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        ) : upcomingAppointments.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingAppointments.slice(0, 3).map((appointment: any) => (
                                    <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                    <Calendar className="h-5 w-5 text-primary-600" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {appointment.visitorName}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {appointment.museum === 'main' ? 'Main Museum' : 'Qin & Han Museum'} • {appointment.timeSlot}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {format(new Date(appointment.visitDate), 'MMM dd, yyyy')}
                                            </p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appointment.status === 'confirmed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {appointment.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming appointments</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Book your first appointment to get started.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
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
                            Create Booking (Admin)
                        </a>
                        <a
                            href="/appointments"
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            View All Appointments
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
