'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCourses() {
  const [pendingCourses, setPendingCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingCourses();
  }, []);

  const fetchPendingCourses = async () => {
    try {
      const res = await adminAPI.getPendingCourses();
      setPendingCourses(res.data || []);
    } catch (error) {
      toast.error('Failed to load pending courses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (courseId) => {
    setActionLoading(courseId);
    try {
      await adminAPI.approveCourse(courseId);
      toast.success('Course approved successfully');
      fetchPendingCourses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve course');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (courseId) => {
    if (!confirm('Are you sure you want to reject this course offering?')) return;
    
    setActionLoading(courseId);
    try {
      await adminAPI.rejectCourse(courseId);
      toast.success('Course rejected');
      fetchPendingCourses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject course');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <RouteGuard allowedRoles={['ADMIN']}>
        <DashboardLayout role="ADMIN">
          <PageSkeleton />
        </DashboardLayout>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <DashboardLayout role="ADMIN">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Approval</h1>
            <p className="mt-2 text-gray-600">Review and approve course offerings</p>
          </div>

          {pendingCourses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No pending course approvals.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{course.courseCode}</h3>
                      <p className="text-lg text-gray-600 mt-1">{course.courseTitle}</p>
                    </div>
                    <StatusBadge status="PENDING_ADMIN_APPROVAL" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">Department</p>
                      <p className="font-medium text-gray-900">{course.department}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Slot</p>
                      <p className="font-medium text-gray-900">{course.slot}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Course Type</p>
                      <p className="font-medium text-gray-900">{course.courseType.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Semester</p>
                      <p className="font-medium text-gray-900">{course.semester.replace(/_/g, ' ')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-500">L (Lecture)</p>
                      <p className="font-medium text-gray-900">{course.L}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">T (Tutorial)</p>
                      <p className="font-medium text-gray-900">{course.T}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">P (Practical)</p>
                      <p className="font-medium text-gray-900">{course.P}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">C (Credits)</p>
                      <p className="font-medium text-gray-900">{course.C}</p>
                    </div>
                  </div>

                  <div className="mb-4 text-sm">
                    <p className="text-gray-500 mb-1">Instructor</p>
                    <p className="font-medium text-gray-900">{course.instructor?.user?.name} ({course.instructor?.user?.email})</p>
                  </div>

                  {(course.allowedBranches.length > 0 || course.allowedYears.length > 0) && (
                    <div className="mb-4 text-sm">
                      <p className="text-gray-500 mb-1">Eligibility</p>
                      {course.allowedBranches.length > 0 && (
                        <p className="text-gray-900">Branches: {course.allowedBranches.join(', ')}</p>
                      )}
                      {course.allowedYears.length > 0 && (
                        <p className="text-gray-900">Entry Years: {course.allowedYears.join(', ')}</p>
                      )}
                    </div>
                  )}

                  {course.syllabus && (
                    <div className="mb-4 text-sm">
                      <p className="text-gray-500 mb-1">Syllabus</p>
                      <p className="text-gray-900 whitespace-pre-wrap">{course.syllabus}</p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4 border-t">
                    <button
                      onClick={() => handleApprove(course.id)}
                      disabled={actionLoading === course.id}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {actionLoading === course.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(course.id)}
                      disabled={actionLoading === course.id}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      {actionLoading === course.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
