import React from 'react';
import { useQuery } from 'react-query';
import { appointmentAPI } from '../services/api';

interface TimingStatusData {
    currentTime: string;
    releaseTime: string;
    timeUntilRelease: string;
    status: 'before_release' | 'in_release_window' | 'after_release_window';
    canBook: boolean;
    nextRelease: string;
}

const TimingStatus: React.FC = () => {
    const { data: timingData, isLoading, error } = useQuery<TimingStatusData>(
        'timing-status',
        () => appointmentAPI.getTimingStatus().then(res => res.data.data),
        {
            refetchInterval: 30000, // Refresh every 30 seconds
            refetchIntervalInBackground: true
        }
    );

    if (isLoading) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-blue-600 font-medium">Loading timing status...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                    <div className="text-red-600 mr-2">⚠️</div>
                    <span className="text-red-600 font-medium">Failed to load timing status</span>
                </div>
            </div>
        );
    }

    if (!timingData) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'before_release':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'in_release_window':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'after_release_window':
                return 'bg-red-50 border-red-200 text-red-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'before_release':
                return '⏳';
            case 'in_release_window':
                return '✅';
            case 'after_release_window':
                return '❌';
            default:
                return '🕐';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'before_release':
                return 'Before Release';
            case 'in_release_window':
                return 'Release Window Active';
            case 'after_release_window':
                return 'Release Window Closed';
            default:
                return 'Unknown Status';
        }
    };

    return (
        <div className={`border rounded-lg p-4 mb-6 ${getStatusColor(timingData.status)}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                    <span className="text-2xl mr-2">{getStatusIcon(timingData.status)}</span>
                    <h3 className="text-lg font-semibold">Museum Booking Timing Status</h3>
                </div>
                <div className="text-sm font-medium">
                    {getStatusText(timingData.status)}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="font-medium">Current Time (China):</span>
                        <span className="font-mono">{timingData.currentTime}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Release Time:</span>
                        <span className="font-mono">{timingData.releaseTime}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Time Until Release:</span>
                        <span className="font-mono">{timingData.timeUntilRelease}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="font-medium">Can Book Now:</span>
                        <span className={`font-semibold ${timingData.canBook ? 'text-green-600' : 'text-red-600'}`}>
                            {timingData.canBook ? 'YES' : 'NO'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium">Next Release:</span>
                        <span className="text-sm">{timingData.nextRelease}</span>
                    </div>
                </div>
            </div>

            {timingData.status === 'before_release' && (
                <div className="mt-3 p-3 bg-yellow-100 rounded-md">
                    <p className="text-sm text-yellow-800">
                        <strong>⏳ Booking Pending:</strong> Tickets will be released at 17:00 (5:00 PM) China time.
                        Your booking will be confirmed automatically when tickets become available.
                    </p>
                </div>
            )}

            {timingData.status === 'in_release_window' && (
                <div className="mt-3 p-3 bg-green-100 rounded-md">
                    <p className="text-sm text-green-800">
                        <strong>✅ Release Window Active:</strong> Tickets are now available!
                        Your booking will be confirmed immediately.
                    </p>
                </div>
            )}

            {timingData.status === 'after_release_window' && (
                <div className="mt-3 p-3 bg-red-100 rounded-md">
                    <p className="text-sm text-red-800">
                        <strong>❌ Release Window Closed:</strong> The 5-minute release window has passed.
                        Please try again tomorrow at 17:00 (5:00 PM) China time.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TimingStatus;
