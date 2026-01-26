'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { teacherAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, coursesRes] = await Promise.all([
        teacherAPI.getDashboard(),
        teacherAPI.getCourses(),
      ]);
      setDashboardData(dashboardRes.data);
      setCourses(coursesRes.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
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

  const approvedCourses = courses.filter(c => c.isApproved);
  const pendingCourses = courses.filter(c => !c.isApproved);

  return (
    <RouteGuard allowedRoles={['TEACHER']}>
      <DashboardLayout role="TEACHER">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {dashboardData?.teacher?.user?.name || 'Teacher'}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Courses Offered</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">{dashboardData?.stats?.courseCount || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Pending Enrollment Requests</h3>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{dashboardData?.stats?.pendingEnrollments || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Advised Students</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">{dashboardData?.stats?.advisedStudents || 0}</p>
            </div>
          </div>

          {/* Approved Courses */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Courses Offered This Semester</h2>

            {/* Search Bar */}
            {approvedCourses.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by course code, title, or slot..."
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}

            {approvedCourses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No approved courses yet.</p>
                <Link href="/teacher/offer-course" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                  Offer a new course →
                </Link>
              </div>
            ) : (
              <>
                {(() => {
                  // Filter approved courses based on search query
                  const filteredCourses = approvedCourses.filter(course => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      course.courseCode.toLowerCase().includes(query) ||
                      course.courseTitle.toLowerCase().includes(query) ||
                      course.slot.toLowerCase().includes(query)
                    );
                  });

                  return (
                    <>
                      {/* Results Count */}
                      {searchQuery && (
                        <div className="text-sm text-gray-600 mb-4">
                          Found {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'}
                        </div>
                      )}

                      {filteredCourses.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                          <p className="text-gray-500">No courses found matching "{searchQuery}"</p>
                          <button
                            onClick={() => setSearchQuery('')}
                            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Clear search
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredCourses.map((course) => {
                            const enrolledCount = course.enrollmentRequests?.filter(e => e.status === 'ENROLLED').length || 0;
                            const pendingCount = course.enrollmentRequests?.filter(e => e.status === 'PENDING_INSTRUCTOR_APPROVAL').length || 0;

                            return (
                              <Link
                                key={course.id}
                                href={`/teacher/course/${course.id}`}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                              >
                                <h3 className="text-lg font-semibold text-gray-900">{course.courseCode}</h3>
                                <p className="text-sm text-gray-600 mt-1">{course.courseTitle}</p>
                                <div className="mt-4 space-y-2 text-sm text-gray-600">
                                  <p>Slot: <span className="font-medium">{course.slot}</span></p>
                                  <p>Enrolled: <span className="font-medium">{enrolledCount}</span></p>
                                  {pendingCount > 0 && (
                                    <p className="text-yellow-600 font-medium">Pending: {pendingCount}</p>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>

          {/* Pending Course Approvals */}
          {pendingCourses.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Course Approvals</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="space-y-2">
                  {pendingCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded p-3">
                      <p className="font-medium">{course.courseCode} - {course.courseTitle}</p>
                      <p className="text-sm text-gray-500">Status: Pending Admin Approval</p>
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
