import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface VisitorDetail {
    name: string;
    idNumber: string;
    idType: string;
    age?: number;
}

const AdminBooking: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        visitorName: '',
        visitorEmail: '',
        visitorPhone: '',
        idNumber: '',
        idType: 'id_card' as string,
        museum: 'main' as string,
        visitDate: '',
        timeSlot: '',
        numberOfVisitors: 1,
        visitorDetails: [
            {
                name: '',
                idNumber: '',
                idType: 'id_card',
                age: undefined
            }
        ] as VisitorDetail[]
    });

    const queryClient = useQueryClient();

    // const { data: museumConfigs } = useQuery(
    //     'museum-configs',
    //     appointmentAPI.getMuseumConfigs
    // );

    const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery(
        ['time-slots', formData.museum, formData.visitDate],
        () => appointmentAPI.getAvailableTimeSlots(formData.museum, formData.visitDate),
        {
            enabled: !!formData.museum && !!formData.visitDate
        }
    );

    const createAppointmentMutation = useMutation(appointmentAPI.createAppointment, {
        onSuccess: (response) => {
            toast.success('Appointment created successfully!');
            // Invalidate all related queries
            queryClient.invalidateQueries('admin-appointments');
            queryClient.invalidateQueries('admin-dashboard-stats');
            queryClient.invalidateQueries('recent-appointments');

            // Navigate to appointments page to see the created appointment
            setTimeout(() => {
                navigate('/admin/appointments');
            }, 1500);
            setFormData({
                visitorName: '',
                visitorEmail: '',
                visitorPhone: '',
                idNumber: '',
                idType: 'id_card',
                museum: 'main',
                visitDate: '',
                timeSlot: '',
                numberOfVisitors: 1,
                visitorDetails: [
                    {
                        name: '',
                        idNumber: '',
                        idType: 'id_card',
                        age: undefined
                    }
                ]
            });
            setCurrentStep(1);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create appointment');
        }
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => {
            const newFormData = { ...prev, [field]: value };

            // Update visitor details when main visitor info changes
            if (field === 'visitorName' || field === 'idNumber' || field === 'idType') {
                // Update the first visitor (main visitor) in the array
                const updatedVisitorDetails = [...prev.visitorDetails];
                if (updatedVisitorDetails.length === 0) {
                    updatedVisitorDetails.push({
                        name: '',
                        idNumber: '',
                        idType: 'id_card',
                        age: undefined
                    });
                }

                updatedVisitorDetails[0] = {
                    ...updatedVisitorDetails[0],
                    name: field === 'visitorName' ? value : prev.visitorName,
                    idNumber: field === 'idNumber' ? value : prev.idNumber,
                    idType: field === 'idType' ? value : prev.idType,
                };

                newFormData.visitorDetails = updatedVisitorDetails;
            }

            // Handle numberOfVisitors change
            if (field === 'numberOfVisitors') {
                const newVisitorDetails = [...prev.visitorDetails];

                // Ensure we have at least the main visitor
                if (newVisitorDetails.length === 0) {
                    newVisitorDetails.push({
                        name: prev.visitorName,
                        idNumber: prev.idNumber,
                        idType: prev.idType,
                        age: undefined
                    });
                }

                // Add or remove visitor details based on numberOfVisitors
                while (newVisitorDetails.length < value) {
                    newVisitorDetails.push({
                        name: '',
                        idNumber: '',
                        idType: 'id_card',
                        age: undefined
                    });
                }

                while (newVisitorDetails.length > value) {
                    newVisitorDetails.pop();
                }

                newFormData.visitorDetails = newVisitorDetails;
            }

            return newFormData;
        });
    };

    const handleVisitorDetailChange = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            visitorDetails: prev.visitorDetails.map((detail, i) =>
                i === index ? { ...detail, [field]: value } : detail
            )
        }));
    };

    // const addVisitorDetail = () => {
    //     if (formData.visitorDetails.length < 5) {
    //         setFormData(prev => ({
    //             ...prev,
    //             visitorDetails: [...prev.visitorDetails, {
    //                 name: '',
    //                 idNumber: '',
    //                 idType: 'id_card',
    //                 age: undefined
    //             }]
    //         }));
    //     }
    // };

    // const removeVisitorDetail = (index: number) => {
    //     setFormData(prev => ({
    //         ...prev,
    //         visitorDetails: prev.visitorDetails.filter((_, i) => i !== index)
    //     }));
    // };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure visitor details match the number of visitors
        const visitorDetails = [];

        // First visitor is always the main visitor
        visitorDetails.push({
            name: formData.visitorName,
            idNumber: formData.idNumber,
            idType: formData.idType,
            age: undefined
        });

        // Add additional visitors if numberOfVisitors > 1
        for (let i = 1; i < formData.numberOfVisitors; i++) {
            if (formData.visitorDetails[i]) {
                // Use existing visitor detail if available
                visitorDetails.push(formData.visitorDetails[i]);
            } else {
                // Create placeholder visitor detail
                visitorDetails.push({
                    name: `Visitor ${i + 1}`,
                    idNumber: '',
                    idType: 'id_card',
                    age: undefined
                });
            }
        }

        // Clean up form data - remove empty optional fields
        const cleanedFormData = {
            ...formData,
            visitorEmail: formData.visitorEmail.trim() || undefined,
            visitorPhone: formData.visitorPhone.trim() || undefined,
            visitorDetails: visitorDetails
        };

        console.log('Submitting appointment data:', cleanedFormData);
        console.log('Number of visitors:', cleanedFormData.numberOfVisitors);
        console.log('Visitor details length:', cleanedFormData.visitorDetails.length);

        createAppointmentMutation.mutate(cleanedFormData);
    };

    const getMinDate = () => {
        const today = new Date();
        return format(today, 'yyyy-MM-dd');
    };

    const getMaxDate = () => {
        const today = new Date();
        const maxDate = addDays(today, 5);
        return format(maxDate, 'yyyy-MM-dd');
    };

    const addDays = (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const idTypes = [
        { value: 'id_card', label: 'Identity card of the People\'s Republic of China' },
        { value: 'hk_macau_passport', label: 'Passport for Hong Kong and Macao residents to and from the Mainland' },
        { value: 'taiwan_permit', label: 'Taiwan residents travel permits to and from the mainland' },
        { value: 'passport', label: 'PASSPORT' },
        { value: 'foreign_id', label: 'Permanent residence identity card for foreigners of the People\'s Republic of China' }
    ];

    const museums = [
        { value: 'main', label: 'Shaanxi History Museum (Xiaozhai East Road, Yanta District Number 91)' },
        { value: 'qin_han', label: 'Qin & Han Dynasties Museum (East Section of Lanchi 3rd Road, Qin & Han New City, Xi\'an-Xian New Area)' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Booking System</h1>
                    <p className="mt-2 text-gray-600">Create appointments for visitors</p>

                    {/* Important Rules */}
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Important Booking Rules:</h3>
                        <ul className="text-xs text-yellow-700 space-y-1">
                            <li>• Each visit plan can add up to 5 visitors maximum</li>
                            <li>• Each ID number is limited to 1 visit ticket per day</li>
                            <li>• Tickets are valid on the same day only</li>
                            <li>• Tickets of the two museums are not interchangeable</li>
                            <li>• Advance booking: 5 days (Main: 17:00, Qin & Han: 17:30)</li>
                            <li>• No-show penalty: 180 days booking restriction</li>
                        </ul>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep >= step
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                    }`}>
                                    {step}
                                </div>
                                {step < 3 && (
                                    <div className={`w-16 h-1 mx-2 ${currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Visitor Info</span>
                        <span>Visit Details</span>
                        <span>Confirmation</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Step 1: Visitor Information */}
                    {currentStep === 1 && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Visitor Information</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 input"
                                        value={formData.visitorName}
                                        onChange={(e) => handleInputChange('visitorName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="mt-1 input"
                                        value={formData.visitorEmail}
                                        onChange={(e) => handleInputChange('visitorEmail', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        className="mt-1 input"
                                        value={formData.visitorPhone}
                                        onChange={(e) => handleInputChange('visitorPhone', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        ID Number *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 input"
                                        value={formData.idNumber}
                                        onChange={(e) => handleInputChange('idNumber', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        ID Type *
                                    </label>
                                    <select
                                        required
                                        className="mt-1 input"
                                        value={formData.idType}
                                        onChange={(e) => handleInputChange('idType', e.target.value)}
                                    >
                                        {idTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Visit Details */}
                    {currentStep === 2 && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Visit Details</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Museum *
                                    </label>
                                    <select
                                        required
                                        className="mt-1 input"
                                        value={formData.museum}
                                        onChange={(e) => handleInputChange('museum', e.target.value)}
                                    >
                                        {museums.map(museum => (
                                            <option key={museum.value} value={museum.value}>
                                                {museum.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Visit Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        min={getMinDate()}
                                        max={getMaxDate()}
                                        className="mt-1 input"
                                        value={formData.visitDate}
                                        onChange={(e) => handleInputChange('visitDate', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Number of Visitors *
                                    </label>
                                    <select
                                        required
                                        className="mt-1 input"
                                        value={formData.numberOfVisitors}
                                        onChange={(e) => {
                                            const num = parseInt(e.target.value);
                                            handleInputChange('numberOfVisitors', num);
                                        }}
                                    >
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <option key={num} value={num}>{num}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Additional Visitor Details */}
                            {formData.numberOfVisitors > 1 && (
                                <div className="mt-6">
                                    <h4 className="text-md font-medium text-gray-900 mb-4">
                                        Additional Visitor Details ({formData.numberOfVisitors - 1} more)
                                    </h4>
                                    <div className="space-y-4">
                                        {formData.visitorDetails.slice(1).map((detail, index) => (
                                            <div key={index + 1} className="border border-gray-200 rounded-lg p-4">
                                                <h5 className="text-sm font-medium text-gray-700 mb-3">
                                                    Visitor {index + 2}
                                                </h5>
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="mt-1 input"
                                                            value={detail.name}
                                                            onChange={(e) => handleVisitorDetailChange(index + 1, 'name', e.target.value)}
                                                            placeholder="Enter visitor name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            ID Number
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="mt-1 input"
                                                            value={detail.idNumber}
                                                            onChange={(e) => handleVisitorDetailChange(index + 1, 'idNumber', e.target.value)}
                                                            placeholder="Enter ID number"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            ID Type
                                                        </label>
                                                        <select
                                                            className="mt-1 input"
                                                            value={detail.idType}
                                                            onChange={(e) => handleVisitorDetailChange(index + 1, 'idType', e.target.value)}
                                                        >
                                                            {idTypes.map(type => (
                                                                <option key={type.value} value={type.value}>
                                                                    {type.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            </div>

                            {/* Time Slots */}
                            {formData.visitDate && (
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Available Time Slots *
                                    </label>
                                    {timeSlotsLoading ? (
                                        <div className="text-center py-4">Loading time slots...</div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {timeSlots?.data?.data?.timeSlots?.map((slot: any) => (
                                                <label key={slot.timeSlot} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="timeSlot"
                                                        value={slot.timeSlot}
                                                        checked={formData.timeSlot === slot.timeSlot}
                                                        onChange={(e) => handleInputChange('timeSlot', e.target.value)}
                                                        disabled={slot.available === 0}
                                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 disabled:opacity-50"
                                                    />
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-gray-900">{slot.timeSlot}</p>
                                                        <p className="text-xs text-gray-500">Available: {slot.available}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {currentStep === 3 && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Confirmation</h3>
                            <div className="space-y-4">
                                <div className="border-b border-gray-200 pb-4">
                                    <h4 className="text-sm font-medium text-gray-900">Visitor Information</h4>
                                    <div className="mt-2 text-sm text-gray-600">
                                        <p><strong>Name:</strong> {formData.visitorName}</p>
                                        <p><strong>Email:</strong> {formData.visitorEmail || 'Not provided'}</p>
                                        <p><strong>Phone:</strong> {formData.visitorPhone || 'Not provided'}</p>
                                        <p><strong>ID:</strong> {formData.idNumber} ({idTypes.find(t => t.value === formData.idType)?.label})</p>
                                    </div>
                                </div>

                                <div className="border-b border-gray-200 pb-4">
                                    <h4 className="text-sm font-medium text-gray-900">Visit Details</h4>
                                    <div className="mt-2 text-sm text-gray-600">
                                        <p><strong>Museum:</strong> {museums.find(m => m.value === formData.museum)?.label}</p>
                                        <p><strong>Date:</strong> {format(new Date(formData.visitDate), 'MMMM dd, yyyy')}</p>
                                        <p><strong>Time:</strong> {formData.timeSlot}</p>
                                        <p><strong>Visitors:</strong> {formData.numberOfVisitors}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Visitor Details</h4>
                                    <div className="mt-2 space-y-2">
                                        {formData.visitorDetails.map((detail, index) => (
                                            <div key={index} className="text-sm text-gray-600">
                                                <p><strong>Visitor {index + 1}:</strong> {detail.name} - {detail.idNumber} ({idTypes.find(t => t.value === detail.idType)?.label})</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                            disabled={currentStep === 1}
                            className="btn btn-outline btn-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                                className="btn btn-primary btn-md"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={createAppointmentMutation.isLoading}
                                className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {createAppointmentMutation.isLoading ? 'Creating...' : 'Create Appointment'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminBooking;
