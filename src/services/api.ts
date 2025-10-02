// import axios from 'axios';

// // const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// // Fix the API URL to always include https://
// let apiUrl = process.env.REACT_APP_API_URL || 'https://backend-museum-fqe0fsgtcddrfeff.canadacentral-01.azurewebsites.net/api';
// if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
//     apiUrl = 'https://' + apiUrl;
// }
// const API_BASE_URL = apiUrl;
// console.log('API_BASE_URL:', API_BASE_URL);
// const api = axios.create({
//     baseURL: API_BASE_URL,
//     headers: {
//         'Content-Type': 'application/json',
//     },
// });

// // Request interceptor to add auth token
// api.interceptors.request.use(
//     (config) => {
//         const token = localStorage.getItem('token');
//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//     },
//     (error) => {
//         return Promise.reject(error);
//     }
// );

// // Response interceptor to handle errors
// api.interceptors.response.use(
//     (response) => response,
//     (error) => {
//         if (error.response?.status === 401) {
//             localStorage.removeItem('token');
//             window.location.href = '/login';
//         }
//         return Promise.reject(error);
//     }
// );

// export const authAPI = {
//     login: (email: string, password: string) =>
//         api.post('/auth/login', { email, password }),

//     register: (email: string, password: string) =>
//         api.post('/auth/register', { email, password }),

//     getProfile: (token: string) =>
//         api.get('/auth/profile', {
//             headers: { Authorization: `Bearer ${token}` }
//         }),
// };

// export const appointmentAPI = {
//     getAppointments: (params?: any) =>
//         api.get('/appointments', { params }),

//     getAppointmentById: (id: string) =>
//         api.get(`/appointments/${id}`),

//     createAppointment: (data: any) =>
//         api.post('/appointments', data),

//     updateAppointment: (id: string, data: any) =>
//         api.put(`/appointments/${id}`, data),

//     cancelAppointment: (id: string) =>
//         api.patch(`/appointments/${id}/cancel`),

//     getAvailableTimeSlots: (museum: string, date: string) =>
//         api.get('/appointments/time-slots', {
//             params: { museum, date }
//         }),

//     getMuseumConfigs: () =>
//         api.get('/appointments/configs'),
// };

// export const adminAPI = {
//     getDashboardStats: () =>
//         api.get('/admin/dashboard'),

//     getAllAppointments: (params?: any) =>
//         api.get('/admin/appointments', { params }),

//     getAppointmentsCount: () =>
//         api.get('/admin/appointments/count'),

//     updateAppointmentStatus: (id: string, status: string) =>
//         api.patch(`/admin/appointments/${id}/status`, { status }),

//     confirmAllPendingAppointments: () =>
//         api.post('/admin/appointments/confirm-all'),

//     systemHealthCheck: () =>
//         api.get('/admin/health'),

//     getUsers: (params?: any) =>
//         api.get('/admin/users', { params }),

//     createUser: (data: any) =>
//         api.post('/admin/users', data),

//     updateUser: (id: string, data: any) =>
//         api.put(`/admin/users/${id}`, data),

//     deleteUser: (id: string) =>
//         api.delete(`/admin/users/${id}`),

//     getMuseumConfigs: () =>
//         api.get('/admin/museum-configs'),

//     createMuseumConfig: (data: any) =>
//         api.post('/admin/museum-configs', data),

//     updateMuseumConfig: (id: string, data: any) =>
//         api.put(`/admin/museum-configs/${id}`, data),
// };

// export default api;


import axios from 'axios';

// Use backend URL from env or fallback to deployed backend
let apiUrl = process.env.REACT_APP_API_URL || 'https://backend-museum-fqe0fsgtcddrfeff.canadacentral-01.azurewebsites.net/api';
if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = 'https://' + apiUrl;
}
const API_BASE_URL = apiUrl;

console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
    register: (email: string, password: string) => api.post('/auth/register', { email, password }),
    getProfile: (token: string) => api.get('/auth/profile', { headers: { Authorization: `Bearer ${token}` } }),
};

// Appointment API
export const appointmentAPI = {
    getAppointments: (params?: any) => api.get('/appointments', { params }),
    getAppointmentById: (id: string) => api.get(`/appointments/${id}`),
    createAppointment: (data: any) => api.post('/appointments', data),
    updateAppointment: (id: string, data: any) => api.put(`/appointments/${id}`, data),
    cancelAppointment: (id: string) => api.patch(`/appointments/${id}/cancel`),
    getAvailableTimeSlots: (museum: string, date: string) => api.get('/appointments/time-slots', { params: { museum, date } }),
    getMuseumConfigs: () => api.get('/appointments/configs'),
};

// Admin API
export const adminAPI = {
    getDashboardStats: () => api.get('/admin/dashboard'),
    getAllAppointments: (params?: any) => api.get('/admin/appointments', { params }),
    getAppointmentsCount: () => api.get('/admin/appointments/count'),
    updateAppointmentStatus: (id: string, status: string) => api.patch(`/admin/appointments/${id}/status`, { status }),
    confirmAllPendingAppointments: () => api.post('/admin/appointments/confirm-all'),
    systemHealthCheck: () => api.get('/admin/health'),
    getUsers: (params?: any) => api.get('/admin/users', { params }),
    createUser: (data: any) => api.post('/admin/users', data),
    updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
    getMuseumConfigs: () => api.get('/admin/museum-configs'),
    createMuseumConfig: (data: any) => api.post('/admin/museum-configs', data),
    updateMuseumConfig: (id: string, data: any) => api.put(`/admin/museum-configs/${id}`, data),
};

export default api;
