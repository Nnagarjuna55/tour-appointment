import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { appointmentAPI } from '../services/api';
import { FileText, Users, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingData {
    visitorName: string;
    idNumber: string;
    idType: string;
    museum: string;
    visitDate: string;
    timeSlot: string;
    numberOfVisitors: number;
    visitorDetails: Array<{
        name: string;
        idNumber: string;
        idType: string;
        age?: number;
    }>;
}

interface ParsedBooking {
    visitorName: string;
    idNumber: string;
    idType: string;
    museum: string;
    visitDate: string;
    timeSlot: string;
    numberOfVisitors: number;
    visitorDetails: Array<{
        name: string;
        idNumber: string;
        idType: string;
        age?: number;
    }>;
}

const AutoBooking: React.FC = () => {
    const [, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedBooking[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [bookingResults, setBookingResults] = useState<any[]>([]);
    const [inputMethod, setInputMethod] = useState<'file' | 'paste'>('file');
    const [pastedData, setPastedData] = useState('');
    const queryClient = useQueryClient();

    const createAppointmentMutation = useMutation(
        (data: BookingData) => appointmentAPI.createAppointment(data),
        {
            onSuccess: (response, variables) => {
                console.log('Booking successful:', response.data);
                setBookingResults(prev => [...prev, {
                    ...variables,
                    success: true,
                    bookingId: response.data?.appointment?._id || 'unknown',
                    museumBookingId: response.data?.museumResponse?.museumBookingId || 'unknown',
                    confirmationCode: response.data?.museumResponse?.confirmationCode || 'unknown'
                }]);
            },
            onError: (error: any, variables) => {
                console.error('Booking failed:', error);
                setBookingResults(prev => [...prev, {
                    ...variables,
                    success: false,
                    error: error?.response?.data?.message || error?.message || 'Booking failed'
                }]);
            }
        }
    );

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = event.target.files?.[0];
        if (uploadedFile) {
            setFile(uploadedFile);
            parseFile(uploadedFile);
        }
    };

    const handlePastedData = () => {
        if (pastedData.trim()) {
            parsePastedData(pastedData);
        }
    };

    const parsePastedData = async (text: string) => {
        setIsProcessing(true);
        try {
            const lines = text.split('\n').filter(line => line.trim());
            const bookings: ParsedBooking[] = [];

            for (const line of lines) {
                const parts = line.split(',').map(part => part.trim());

                // Clean up corrupted data - remove binary characters
                const cleanParts = parts.map(part => {
                    // Remove null bytes and other binary characters
                    return part.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
                }).filter(part => part.length > 0);

                // Handle simple "name, ID" format (exactly as provided)
                if (cleanParts.length === 2 && cleanParts[0] && cleanParts[1]) {
                    // Skip empty lines or lines that don't look like name, ID
                    if (cleanParts[0].length > 0 && cleanParts[1].length > 0) {
                        const booking: ParsedBooking = {
                            visitorName: cleanParts[0],
                            idNumber: cleanParts[1],
                            idType: 'id_card',
                            museum: 'main',
                            visitDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
                            timeSlot: '16:30-18:00',
                            numberOfVisitors: 1,
                            visitorDetails: [{
                                name: cleanParts[0],
                                idNumber: cleanParts[1],
                                idType: 'id_card',
                                age: undefined
                            }]
                        };
                        bookings.push(booking);
                    }
                }
                // Handle full format (6+ columns)
                else if (cleanParts.length >= 6) {
                    const booking: ParsedBooking = {
                        visitorName: cleanParts[0],
                        idNumber: cleanParts[1],
                        idType: cleanParts[2] || 'id_card',
                        museum: cleanParts[3] || 'main',
                        visitDate: cleanParts[4],
                        timeSlot: cleanParts[5],
                        numberOfVisitors: parseInt(cleanParts[6]) || 1,
                        visitorDetails: [{
                            name: cleanParts[0],
                            idNumber: cleanParts[1],
                            idType: cleanParts[2] || 'id_card',
                            age: cleanParts[7] ? parseInt(cleanParts[7]) : undefined
                        }]
                    };
                    bookings.push(booking);
                }
            }

            setParsedData(bookings);
            toast.success(`Parsed ${bookings.length} bookings from pasted data`);
        } catch (error) {
            console.error('Error parsing pasted data:', error);
            toast.error('Error parsing pasted data');
        } finally {
            setIsProcessing(false);
        }
    };

    const parseFile = async (file: File) => {
        setIsProcessing(true);
        try {
            let text = '';

            // Handle different file types
            if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                // Word files are binary and can't be read as text directly
                toast.error('Word files (.doc/.docx) are not supported. Please save as CSV or Text file first.');
                setIsProcessing(false);
                return;
            } else {
                // For CSV and TXT files
                text = await file.text();
            }

            const lines = text.split('\n').filter(line => line.trim());
            const bookings: ParsedBooking[] = [];

            for (const line of lines) {
                const parts = line.split(',').map(part => part.trim());

                // Clean up corrupted data - remove binary characters
                const cleanParts = parts.map(part => {
                    // Remove null bytes and other binary characters
                    return part.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
                }).filter(part => part.length > 0);

                // Handle simple "name, ID" format (exactly as provided)
                if (cleanParts.length === 2 && cleanParts[0] && cleanParts[1]) {
                    // Skip empty lines or lines that don't look like name, ID
                    if (cleanParts[0].length > 0 && cleanParts[1].length > 0) {
                        const booking: ParsedBooking = {
                            visitorName: cleanParts[0],
                            idNumber: cleanParts[1],
                            idType: 'id_card',
                            museum: 'main',
                            visitDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
                            timeSlot: '16:30-18:00',
                            numberOfVisitors: 1,
                            visitorDetails: [{
                                name: cleanParts[0],
                                idNumber: cleanParts[1],
                                idType: 'id_card',
                                age: undefined
                            }]
                        };
                        bookings.push(booking);
                    }
                }
                // Handle full format (6+ columns)
                else if (cleanParts.length >= 6) {
                    const booking: ParsedBooking = {
                        visitorName: cleanParts[0],
                        idNumber: cleanParts[1],
                        idType: cleanParts[2] || 'id_card',
                        museum: cleanParts[3] || 'main',
                        visitDate: cleanParts[4],
                        timeSlot: cleanParts[5],
                        numberOfVisitors: parseInt(cleanParts[6]) || 1,
                        visitorDetails: [{
                            name: cleanParts[0],
                            idNumber: cleanParts[1],
                            idType: cleanParts[2] || 'id_card',
                            age: cleanParts[7] ? parseInt(cleanParts[7]) : undefined
                        }]
                    };
                    bookings.push(booking);
                }
            }

            setParsedData(bookings);
            toast.success(`Parsed ${bookings.length} bookings from file`);
        } catch (error) {
            console.error('Error parsing file:', error);
            toast.error('Error parsing file');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkBooking = async () => {
        if (parsedData.length === 0) {
            toast.error('No data to book');
            return;
        }

        setBookingResults([]);
        toast.loading(`⚡ FAST PROCESSING: ${parsedData.length} bookings in parallel (5-minute window!)...`);

        // Check for duplicates within the parsed data
        const duplicateIds = new Set<string>();
        const seenIds = new Set<string>();
        const duplicateEntries: string[] = [];

        for (const booking of parsedData) {
            const idKey = `${booking.idNumber}-${booking.visitDate}`;
            if (seenIds.has(idKey)) {
                duplicateIds.add(booking.idNumber);
                duplicateEntries.push(`${booking.visitorName} (${booking.idNumber})`);
            } else {
                seenIds.add(idKey);
            }
        }

        if (duplicateIds.size > 0) {
            toast.error(`Duplicate entries found in your data: ${duplicateEntries.join(', ')}. Please remove duplicates before processing.`);
            return;
        }

        // Process all bookings in parallel for maximum speed
        const bookingPromises = parsedData.map(async (booking, index) => {
            try {
                // Minimal delay to stagger requests (25ms per booking for speed)
                await new Promise(resolve => setTimeout(resolve, index * 25));
                const result = await createAppointmentMutation.mutateAsync(booking);

                // Update progress
                const progress = Math.round(((index + 1) / parsedData.length) * 100);
                toast.loading(`⚡ FAST PROCESSING: ${progress}% complete (${index + 1}/${parsedData.length})...`);

                return result;
            } catch (error: any) {
                console.error('Booking failed:', error);
                return {
                    success: false,
                    error: error?.message || 'Booking failed',
                    visitorName: booking?.visitorName || 'Unknown',
                    idNumber: booking?.idNumber || 'Unknown'
                };
            }
        });

        // Wait for all bookings to complete
        await Promise.all(bookingPromises);

        toast.dismiss();
        toast.success(`Processed ${parsedData.length} bookings`);
        queryClient.invalidateQueries('appointments');
    };

    const downloadTemplate = () => {
        const template = `visitorName,idNumber,idType,museum,visitDate,timeSlot,numberOfVisitors,age
John Doe,123456789012345678,id_card,main,2025-10-09,16:30-18:00,1,25
Jane Smith,987654321098765432,id_card,qin_han,2025-10-09,14:30-16:30,1,30`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'booking_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const downloadSimpleTemplate = () => {
        const template = `张丹,510105197908271783
王远游,512221197303150994
伍鸿睿,510703200606130015
王靖怡,440106200306064421
杨舟,320115200603154115

杨广坤,320112197810091619
周娟,320121198008284123
夏玲,360481197701073426
赵宋礼,360421197810114016
姜英龙,342423197706066377

赵夏思浔,360481200407233526
欧榆淇,441223200310251740
罗进,440683200404093920
罗珉安,441223200401296223
周乐思,440683200311165526`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'simple_booking_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">⚡ FAST Auto Booking System</h3>
                <p className="text-sm text-gray-600">
                    Upload a CSV file with booking data for bulk processing
                </p>
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                        <div className="text-yellow-600 mr-2">⚡</div>
                        <div>
                            <h5 className="text-sm font-medium text-yellow-800">SPEED CRITICAL:</h5>
                            <p className="text-xs text-yellow-700 mt-1">
                                Museum tickets release at 17:00 China time for only 5 minutes!
                                System processes all bookings in parallel for maximum speed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Input Method Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Input Method
                </label>
                <div className="flex space-x-4 mb-4">
                    <button
                        onClick={() => setInputMethod('file')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${inputMethod === 'file'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        📁 Upload File
                    </button>
                    <button
                        onClick={() => setInputMethod('paste')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${inputMethod === 'paste'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        📋 Copy & Paste Data
                    </button>
                </div>

                {/* File Upload Option */}
                {inputMethod === 'file' && (
                    <div className="flex items-center space-x-4">
                        <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Full Template
                        </button>
                        <button
                            onClick={downloadSimpleTemplate}
                            className="flex items-center px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Simple Template
                        </button>
                    </div>
                )}

                {/* Copy & Paste Option */}
                {inputMethod === 'paste' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Paste your data here (Name, ID format):
                            </label>
                            <textarea
                                value={pastedData}
                                onChange={(e) => setPastedData(e.target.value)}
                                placeholder="张丹,510105197908271783
王远游,512221197303150994
伍鸿睿,510703200606130015"
                                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handlePastedData}
                                disabled={!pastedData.trim() || isProcessing}
                                className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                {isProcessing ? 'Processing...' : 'Parse Data'}
                            </button>
                            <button
                                onClick={() => setPastedData('')}
                                className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="text-xs text-gray-500">
                            <p><strong>Format:</strong> Name, ID Number (one per line)</p>
                            <p><strong>Example:</strong> 张丹,510105197908271783</p>
                            <p><strong>Auto-assigned:</strong> Main museum, 5 days ahead, 16:30-18:00</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Parsed Data Preview */}
            {parsedData.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                        Parsed Data ({parsedData.length} bookings)
                    </h4>

                    {/* Duplicate Check */}
                    {(() => {
                        const seenIds = new Set<string>();
                        const duplicates: string[] = [];

                        for (const booking of parsedData) {
                            const idKey = `${booking.idNumber}-${booking.visitDate}`;
                            if (seenIds.has(idKey)) {
                                duplicates.push(`${booking.visitorName} (${booking.idNumber})`);
                            } else {
                                seenIds.add(idKey);
                            }
                        }

                        return duplicates.length > 0 ? (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-center">
                                    <div className="text-red-600 mr-2">⚠️</div>
                                    <div>
                                        <h5 className="text-sm font-medium text-red-800">Duplicate entries detected:</h5>
                                        <p className="text-xs text-red-700 mt-1">
                                            {duplicates.join(', ')} - Please remove duplicates before booking.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null;
                    })()}

                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Museum</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {parsedData.map((booking, index) => {
                                    // Check if this entry is a duplicate
                                    const isDuplicate = parsedData.slice(0, index).some(prev =>
                                        prev.idNumber === booking.idNumber && prev.visitDate === booking.visitDate
                                    );

                                    return (
                                        <tr key={index} className={isDuplicate ? 'bg-red-50' : ''}>
                                            <td className="px-3 py-2 text-sm text-gray-900">{booking.visitorName}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{booking.idNumber}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{booking.museum}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{booking.visitDate}</td>
                                            <td className="px-3 py-2 text-sm text-gray-500">{booking.timeSlot}</td>
                                            <td className="px-3 py-2 text-sm">
                                                {isDuplicate ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        Duplicate
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Ready
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Booking Results */}
            {bookingResults && bookingResults.length > 0 && (
                <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                        Booking Results ({bookingResults.length} processed)
                    </h4>
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Museum ID</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Confirmation</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bookingResults.map((result, index) => (
                                    <tr key={index}>
                                        <td className="px-3 py-2 text-sm text-gray-900">{result?.visitorName || result?.original?.visitorName || 'Unknown'}</td>
                                        <td className="px-3 py-2 text-sm">
                                            {result?.success ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Success
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-500 font-mono">
                                            {result?.museumBookingId || result?.bookingId || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-500 font-mono">
                                            {result?.confirmationCode || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={handleBulkBooking}
                    disabled={parsedData.length === 0 || isProcessing}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Users className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Processing...' : `Book ${parsedData.length} Appointments`}
                </button>

                <button
                    onClick={() => {
                        setFile(null);
                        setParsedData([]);
                        setBookingResults([]);
                        setPastedData('');
                    }}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                    Clear All
                </button>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Input Format Instructions:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h6 className="text-xs font-medium text-blue-900 mb-1">📋 Copy & Paste Format:</h6>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Format: Name, ID Number (one per line)</li>
                            <li>• Example: 张丹,510105197908271783</li>
                            <li>• Just paste your data directly into the text area</li>
                            <li>• Auto-assigned: Main museum, 5 days ahead, 16:30-18:00</li>
                            <li>• No file upload needed - instant processing</li>
                            <li>• 🚫 Duplicate IDs not allowed - each ID can only book once per day</li>
                        </ul>
                    </div>
                    <div>
                        <h6 className="text-xs font-medium text-blue-900 mb-1">📁 File Upload Format:</h6>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• Simple: Name, ID (same as copy-paste)</li>
                            <li>• Full: visitorName,idNumber,idType,museum,visitDate,timeSlot,numberOfVisitors,age</li>
                            <li>• Supports: CSV (.csv) and Text (.txt) files only</li>
                            <li>• idType: id_card, passport, hk_macau_passport, taiwan_permit, foreign_id</li>
                            <li>• museum: main (Shaanxi History Museum) or qin_han (Qin & Han Museum)</li>
                            <li>• ⚠️ Word files (.doc/.docx) not supported - save as CSV first</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AutoBooking;
