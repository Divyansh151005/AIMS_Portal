'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { courseAPI, enrollmentAPI, studentAPI } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function StudentCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, enrollmentsRes, userData] = await Promise.all([
        courseAPI.getApprovedCourses(),
        enrollmentAPI.getMyEnrollments(),
        getCurrentUser(),
      ]);

      setCourses(coursesRes.data || []);
      setEnrollments(enrollmentsRes.data || []);

      // Get student info for eligibility check
      if (userData.student) {
        setStudentInfo(userData.student);
      }
    } catch (error) {
      toast.error('Failed to load courses');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseOfferingId) => {
    setEnrolling(courseOfferingId);
    try {
      await enrollmentAPI.enroll(courseOfferingId);
      toast.success('Enrollment request submitted! Status: Pending Instructor Approval');
      router.push('/student/dashboard');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to enroll in course';
      toast.error(errorMsg);
    } finally {
      setEnrolling(null);
    }
  };

  const isEligible = (course) => {
    if (!studentInfo) return false;

    // Case-insensitive branch matching
    let branchMatch = true;
    if (course.allowedBranches.length > 0) {
      const studentBranchUpper = studentInfo.branch.toUpperCase();
      const allowedBranchesUpper = course.allowedBranches.map(b => b.toUpperCase());
      branchMatch = allowedBranchesUpper.includes(studentBranchUpper);
    }

    const yearMatch = course.allowedYears.length === 0 || course.allowedYears.includes(studentInfo.entryYear);

    return branchMatch && yearMatch;
  };

  // Slot conflict detection removed as per requirements

  const getEnrollmentStatus = (courseId) => {
    const enrollment = enrollments.find(e => e.courseOfferingId === courseId);
    return enrollment?.status || null;
  };

  const canEnroll = (course) => {
    const status = getEnrollmentStatus(course.id);
    if (status && status !== 'DROPPED') return false;
    if (!isEligible(course)) return false;
    // Slot conflict check removed as per requirements
    return true;
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

  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <DashboardLayout role="STUDENT">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Available Courses</h1>
            <p className="mt-2 text-gray-600">Browse and enroll in approved courses</p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-md p-4">
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
                placeholder="Search by course code, title, department, or instructor..."
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

          {courses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No approved courses available at the moment.</p>
            </div>
          ) : (
            <>
              {(() => {
                // Filter courses based on search query
                const filteredCourses = courses.filter(course => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    course.courseCode.toLowerCase().includes(query) ||
                    course.courseTitle.toLowerCase().includes(query) ||
                    course.department.toLowerCase().includes(query) ||
                    course.instructor?.user?.name?.toLowerCase().includes(query)
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
                          const enrollmentStatus = getEnrollmentStatus(course.id);
                          const eligible = isEligible(course);
                          const canEnrollCourse = canEnroll(course);

                          return (
                            <div key={course.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{course.courseCode}</h3>
                                  <p className="text-sm text-gray-600 mt-1">{course.courseTitle}</p>
                                </div>
                                {enrollmentStatus && <StatusBadge status={enrollmentStatus} />}
                              </div>

                              <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <p>Slot: <span className="font-medium">{course.slot}</span></p>
                                <p>Credits: <span className="font-medium">{course.C}</span></p>
                                <p>Instructor: <span className="font-medium">{course.instructor?.user?.name}</span></p>
                                <p>Department: <span className="font-medium">{course.department}</span></p>
                                <p>Type: <span className="font-medium">{course.courseType.replace(/_/g, ' ')}</span></p>
                              </div>

                              {!eligible && (
                                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                  Not eligible (branch/year restriction)
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Link
                                  href={`/student/course/${course.id}`}
                                  className="flex-1 text-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                                >
                                  View Details
                                </Link>
                                {canEnrollCourse && (
                                  <button
                                    onClick={() => handleEnroll(course.id)}
                                    disabled={enrolling === course.id}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                  >
                                    {enrolling === course.id ? 'Enrolling...' : 'Enroll'}
                                  </button>
                                )}
                                {enrollmentStatus === 'DROPPED' && (
                                  <button
                                    onClick={() => handleEnroll(course.id)}
                                    disabled={enrolling === course.id}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                  >
                                    {enrolling === course.id ? 'Enrolling...' : 'Re-enroll'}
                                  </button>
                                )}
                              </div>
                            </div>
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
      </DashboardLayout>
    </RouteGuard>
  );
}
