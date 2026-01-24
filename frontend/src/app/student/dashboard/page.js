'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { studentAPI, enrollmentAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, enrollmentsRes] = await Promise.all([
        studentAPI.getDashboard(),
        studentAPI.getCourses(), // This returns enrolled courses
      ]);
      setDashboardData(dashboardRes.data);
      setEnrollments(enrollmentsRes.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RouteGuard allowedRoles={['STUDENT']}>
        <DashboardLayout role="STUDENT">
          <PageSkeleton />
        </DashboardLayout>
      </RouteGuard>
    );
  }

  const enrolled = enrollments.filter(e => e.status === 'ENROLLED');
  const pendingInstructor = enrollments.filter(e => e.status === 'PENDING_INSTRUCTOR_APPROVAL');
  const pendingAdvisor = enrollments.filter(e => e.status === 'PENDING_ADVISOR_APPROVAL');
  const dropped = enrollments.filter(e => e.status === 'DROPPED');

  const totalCredits = enrolled.reduce((sum, e) => sum + (e.courseOffering?.C || 0), 0);

  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <DashboardLayout role="STUDENT">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {dashboardData?.student?.user?.name || 'Student'}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Enrolled Courses</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">{enrolled.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{pendingInstructor.length + pendingAdvisor.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Credits</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">{totalCredits.toFixed(1)}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Dropped Courses</h3>
              <p className="mt-2 text-3xl font-bold text-gray-600">{dropped.length}</p>
            </div>
          </div>

          {/* Pending Approvals Section */}
          {(pendingInstructor.length > 0 || pendingAdvisor.length > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Approvals</h2>
              
              {pendingInstructor.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Pending Instructor Approval</h3>
                  <div className="space-y-2">
                    {pendingInstructor.map((enrollment) => (
                      <div key={enrollment.id} className="bg-white rounded p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{enrollment.courseOffering?.courseCode} - {enrollment.courseOffering?.courseTitle}</p>
                          <p className="text-sm text-gray-500">Slot: {enrollment.courseOffering?.slot}</p>
                        </div>
                        <StatusBadge status={enrollment.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingAdvisor.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Pending Advisor Approval</h3>
                  <div className="space-y-2">
                    {pendingAdvisor.map((enrollment) => (
                      <div key={enrollment.id} className="bg-white rounded p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{enrollment.courseOffering?.courseCode} - {enrollment.courseOffering?.courseTitle}</p>
                          <p className="text-sm text-gray-500">Slot: {enrollment.courseOffering?.slot}</p>
                        </div>
                        <StatusBadge status={enrollment.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enrolled Courses */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Courses</h2>
            {enrolled.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No enrolled courses yet.</p>
                <Link href="/student/courses" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                  Browse available courses →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolled.map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    href={`/student/course/${enrollment.courseOfferingId}`}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {enrollment.courseOffering?.courseCode}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{enrollment.courseOffering?.courseTitle}</p>
                      </div>
                      <StatusBadge status={enrollment.status} />
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Slot: <span className="font-medium">{enrollment.courseOffering?.slot}</span></p>
                      <p>Credits: <span className="font-medium">{enrollment.courseOffering?.C}</span></p>
                      <p>Instructor: <span className="font-medium">{enrollment.courseOffering?.instructor?.user?.name}</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Dropped Courses */}
          {dropped.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Dropped Courses</h2>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="divide-y">
                  {dropped.map((enrollment) => (
                    <div key={enrollment.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{enrollment.courseOffering?.courseCode} - {enrollment.courseOffering?.courseTitle}</p>
                        <p className="text-sm text-gray-500">Dropped on {new Date(enrollment.droppedAt).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={enrollment.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
