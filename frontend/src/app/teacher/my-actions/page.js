'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { enrollmentAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TeacherMyActions() {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState({
        instructor: [],
        advisor: [],
    });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('instructor'); // 'instructor' or 'advisor'

    useEffect(() => {
        fetchEnrollmentRequests();
    }, []);

    const fetchEnrollmentRequests = async () => {
        try {
            const response = await enrollmentAPI.getRequests();
            setEnrollments({
                instructor: response.data.instructorEnrollments || [],
                advisor: response.data.advisorEnrollments || [],
            });
        } catch (error) {
            toast.error('Failed to load enrollment requests');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (enrollmentId, type) => {
        setActionLoading(enrollmentId);
        try {
            if (type === 'instructor') {
                await enrollmentAPI.approveInstructor(enrollmentId);
                toast.success('Enrollment approved and sent to advisor');
            } else {
                await enrollmentAPI.approveAdvisor(enrollmentId);
                toast.success('Enrollment approved successfully');
            }
            fetchEnrollmentRequests();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to approve enrollment');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (enrollmentId) => {
        setActionLoading(enrollmentId);
        try {
            await enrollmentAPI.reject(enrollmentId);
            toast.success('Enrollment request rejected');
            fetchEnrollmentRequests();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to reject enrollment');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <RouteGuard allowedRoles={['TEACHER']}>
                <DashboardLayout role="TEACHER">
                    <PageSkeleton />
                </DashboardLayout>
            </RouteGuard>
        );
    }

    const instructorCount = enrollments.instructor.length;
    const advisorCount = enrollments.advisor.length;

    return (
        <RouteGuard allowedRoles={['TEACHER']}>
            <DashboardLayout role="TEACHER">
                <div className="space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Actions</h1>
                        <p className="text-gray-600 mt-1">
                            Review and approve enrollment requests
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">As Instructor</p>
                                    <p className="text-3xl font-bold text-blue-900 mt-1">
                                        {instructorCount}
                                    </p>
                                    <p className="text-sm text-blue-700 mt-1">Pending approval</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">As Advisor</p>
                                    <p className="text-3xl font-bold text-green-900 mt-1">
                                        {advisorCount}
                                    </p>
                                    <p className="text-sm text-green-700 mt-1">Pending approval</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg
                                        className="w-6 h-6 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('instructor')}
                                className={`${activeTab === 'instructor'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                Instructor Requests
                                {instructorCount > 0 && (
                                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
                                        {instructorCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('advisor')}
                                className={`${activeTab === 'advisor'
                                        ? 'border-green-500 text-green-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                                Advisor Requests
                                {advisorCount > 0 && (
                                    <span className="ml-2 bg-green-100 text-green-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
                                        {advisorCount}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>

                    {/* Instructor Requests Tab */}
                    {activeTab === 'instructor' && (
                        <div>
                            {instructorCount === 0 ? (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <p className="mt-4 text-gray-500">
                                        No pending instructor approvals
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Enrollment requests for your courses will appear here
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Student
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Course
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Slot
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
                                                {enrollments.instructor.map((enrollment) => (
                                                    <tr key={enrollment.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {enrollment.student?.user?.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {enrollment.student?.user?.email}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-900">
                                                                {enrollment.courseOffering?.courseCode}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {enrollment.courseOffering?.courseTitle}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {enrollment.courseOffering?.slot || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <StatusBadge status={enrollment.status} />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleApprove(enrollment.id, 'instructor')}
                                                                    disabled={actionLoading === enrollment.id}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {actionLoading === enrollment.id ? (
                                                                        <>
                                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                            Processing...
                                                                        </>
                                                                    ) : (
                                                                        'Approve'
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(enrollment.id)}
                                                                    disabled={actionLoading === enrollment.id}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Advisor Requests Tab */}
                    {activeTab === 'advisor' && (
                        <div>
                            {advisorCount === 0 ? (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <p className="mt-4 text-gray-500">
                                        No pending advisor approvals
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Enrollment requests from your advisees will appear here
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Student (Advisee)
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Course
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Instructor
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Slot
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
                                                {enrollments.advisor.map((enrollment) => (
                                                    <tr key={enrollment.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {enrollment.student?.user?.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {enrollment.student?.user?.email}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-900">
                                                                {enrollment.courseOffering?.courseCode}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {enrollment.courseOffering?.courseTitle}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {enrollment.courseOffering?.instructor?.user?.name || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {enrollment.courseOffering?.slot || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <StatusBadge status={enrollment.status} />
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleApprove(enrollment.id, 'advisor')}
                                                                    disabled={actionLoading === enrollment.id}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {actionLoading === enrollment.id ? (
                                                                        <>
                                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                            Processing...
                                                                        </>
                                                                    ) : (
                                                                        'Approve'
                                                                    )}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleReject(enrollment.id)}
                                                                    disabled={actionLoading === enrollment.id}
                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}