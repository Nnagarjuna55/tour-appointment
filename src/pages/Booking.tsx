import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../services/api';
import { Calendar, Clock, MapPin, Users, User, Phone, Mail, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays } from 'date-fns';
import TimingStatus from '../components/TimingStatus';

interface VisitorDetail {
    name: string;
    idNumber: string;
    idType: string;
    age?: number;
}

const Booking: React.FC = () => {
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
        visitorDetails: [] as VisitorDetail[]
    });

    const { data: museumConfigs } = useQuery(
        'museum-configs',
        appointmentAPI.getMuseumConfigs
    );

    const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery(
        ['time-slots', formData.museum, formData.visitDate],
        () => appointmentAPI.getAvailableTimeSlots(formData.museum, formData.visitDate),
        {
            enabled: !!formData.museum && !!formData.visitDate
        }
    );

    const createAppointmentMutation = useMutation(appointmentAPI.createAppointment, {
        onSuccess: () => {
            toast.success('Appointment booked successfully!');
            navigate('/appointments');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to book appointment');
        }
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleVisitorDetailChange = (index: number, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            visitorDetails: prev.visitorDetails.map((detail, i) =>
                i === index ? { ...detail, [field]: value } : detail
            )
        }));
    };

    const addVisitorDetail = () => {
        if (formData.visitorDetails.length < 4) {
            setFormData(prev => ({
                ...prev,
                visitorDetails: [...prev.visitorDetails, {
                    name: '',
                    idNumber: '',
                    idType: 'id_card',
                    age: undefined
                }]
            }));
        }
    };

    const removeVisitorDetail = (index: number) => {
        setFormData(prev => ({
            ...prev,
            visitorDetails: prev.visitorDetails.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Create visitor details from main visitor info
        const visitorDetails = [{
            name: formData.visitorName,
            idNumber: formData.idNumber,
            idType: formData.idType,
            age: undefined
        }];

        // Clean up form data - remove empty optional fields
        const cleanedFormData = {
            ...formData,
            visitorEmail: formData.visitorEmail.trim() || undefined,
            visitorPhone: formData.visitorPhone.trim() || undefined,
            visitorDetails: visitorDetails
        };

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

    const idTypes = [
        { value: 'id_card', label: 'Chinese ID Card' },
        { value: 'passport', label: 'Passport' },
        { value: 'hk_macau_passport', label: 'Hong Kong/Macau Passport' },
        { value: 'taiwan_permit', label: 'Taiwan Travel Permit' },
        { value: 'foreign_id', label: 'Foreign ID Card' }
    ];

    const museums = [
        { value: 'main', label: 'Shaanxi History Museum (Main)', address: 'Xiaozhai East Road, Yanta District' },
        { value: 'qin_han', label: 'Qin & Han Dynasties Museum', address: 'East Section of Lanchi 3rd Road, Qin & Han New City' }
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Make a reservation for your museum visit
                </p>

                {/* Timing Status Component */}
                <TimingStatus />
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center">
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${currentStep >= step
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-200 text-gray-600'
                                }`}>
                                {step}
                            </div>
                            {step < 4 && (
                                <div className={`w-16 h-1 mx-2 ${currentStep > step ? 'bg-primary-600' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Personal Info</span>
                    <span>Museum & Date</span>
                    <span>Visitor Details</span>
                    <span>Confirmation</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Personal Information */}
                {currentStep === 1 && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
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
                            <div className="sm:col-span-2">
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

                {/* Step 2: Museum & Date Selection */}
                {currentStep === 2 && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Museum & Date Selection</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Select Museum *
                                </label>
                                <div className="space-y-3">
                                    {museums.map(museum => (
                                        <label key={museum.value} className="flex items-start">
                                            <input
                                                type="radio"
                                                name="museum"
                                                value={museum.value}
                                                checked={formData.museum === museum.value}
                                                onChange={(e) => handleInputChange('museum', e.target.value)}
                                                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                            />
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {museum.label}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {museum.address}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
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
                                <p className="mt-1 text-sm text-gray-500">
                                    Bookings can be made up to 5 days in advance
                                </p>
                            </div>

                            {formData.visitDate && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Time Slot *
                                    </label>
                                    {timeSlotsLoading ? (
                                        <div className="mt-2 animate-pulse">
                                            <div className="h-10 bg-gray-200 rounded"></div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                            {timeSlots?.data?.data?.timeSlots?.map((slot: any) => (
                                                <label key={slot.timeSlot} className="flex items-center">
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
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {slot.timeSlot}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {slot.available} available
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Visitor Details */}
                {currentStep === 3 && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Visitor Details</h3>
                        <div className="mb-4">
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
                                    // Adjust visitor details array
                                    const newDetails = Array.from({ length: num }, (_, i) =>
                                        formData.visitorDetails[i] || { name: '', idNumber: '', idType: 'id_card', age: undefined }
                                    );
                                    setFormData(prev => ({ ...prev, visitorDetails: newDetails }));
                                }}
                            >
                                {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4">
                            {formData.visitorDetails.map((detail, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            Visitor {index + 1}
                                        </h4>
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => removeVisitorDetail(index)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 input"
                                                value={detail.name}
                                                onChange={(e) => handleVisitorDetailChange(index, 'name', e.target.value)}
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
                                                value={detail.idNumber}
                                                onChange={(e) => handleVisitorDetailChange(index, 'idNumber', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                ID Type *
                                            </label>
                                            <select
                                                required
                                                className="mt-1 input"
                                                value={detail.idType}
                                                onChange={(e) => handleVisitorDetailChange(index, 'idType', e.target.value)}
                                            >
                                                {idTypes.map(type => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Age (Optional)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="120"
                                                className="mt-1 input"
                                                value={detail.age || ''}
                                                onChange={(e) => handleVisitorDetailChange(index, 'age', e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 4: Confirmation */}
                {currentStep === 4 && (
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Confirmation</h3>
                        <div className="space-y-4">
                            <div className="border-b border-gray-200 pb-4">
                                <h4 className="text-sm font-medium text-gray-900">Personal Information</h4>
                                <div className="mt-2 text-sm text-gray-600">
                                    <p><strong>Name:</strong> {formData.visitorName}</p>
                                    <p><strong>Email:</strong> {formData.visitorEmail}</p>
                                    <p><strong>Phone:</strong> {formData.visitorPhone}</p>
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
                                <h4 className="text-sm font-medium text-gray-900">Visitor List</h4>
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

                    {currentStep < 4 ? (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
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
                            {createAppointmentMutation.isLoading ? 'Booking...' : 'Confirm Booking'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default Booking;
