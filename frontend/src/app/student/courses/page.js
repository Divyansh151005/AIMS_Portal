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
      if (error.response?.status === 409 && errorMsg.includes('Slot conflict')) {
        toast.error(errorMsg);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setEnrolling(null);
    }
  };

  const isEligible = (course) => {
    if (!studentInfo) return false;
    
    const branchMatch = course.allowedBranches.length === 0 || course.allowedBranches.includes(studentInfo.branch);
    const yearMatch = course.allowedYears.length === 0 || course.allowedYears.includes(studentInfo.entryYear);
    
    return branchMatch && yearMatch;
  };

  const hasSlotConflict = (course) => {
    return enrollments.some(e => {
      const activeStatuses = ['ENROLLED', 'PENDING_INSTRUCTOR_APPROVAL', 'PENDING_ADVISOR_APPROVAL'];
      return activeStatuses.includes(e.status) && e.courseOffering?.slot === course.slot;
    });
  };

  const getEnrollmentStatus = (courseId) => {
    const enrollment = enrollments.find(e => e.courseOfferingId === courseId);
    return enrollment?.status || null;
  };

  const canEnroll = (course) => {
    const status = getEnrollmentStatus(course.id);
    if (status && status !== 'DROPPED') return false;
    if (!isEligible(course)) return false;
    if (hasSlotConflict(course)) return false;
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

          {courses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No approved courses available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const enrollmentStatus = getEnrollmentStatus(course.id);
                const eligible = isEligible(course);
                const slotConflict = hasSlotConflict(course);
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

                    {slotConflict && (
                      <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                        Slot conflict detected
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
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
