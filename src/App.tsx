import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBooking from './pages/admin/AdminBooking';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMuseumConfig from './pages/admin/AdminMuseumConfig';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <Router>
                    <div className="min-h-screen bg-gray-50">
                        <Toaster position="top-right" />
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />

                            {/* Redirect old booking route to admin booking */}
                            <Route path="/booking" element={<Navigate to="/admin/booking" replace />} />

                            <Route path="/" element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }>
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="appointments" element={<Appointments />} />
                                <Route path="admin" element={<AdminDashboard />} />
                                <Route path="admin/booking" element={<AdminBooking />} />
                                <Route path="admin/appointments" element={<AdminAppointments />} />
                                <Route path="admin/users" element={<AdminUsers />} />
                                <Route path="admin/museum-config" element={<AdminMuseumConfig />} />
                            </Route>
                        </Routes>
                    </div>
                </Router>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
