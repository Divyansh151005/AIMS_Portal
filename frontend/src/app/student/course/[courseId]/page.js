'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { courseAPI, enrollmentAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;
  
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const [courseRes, enrollmentsRes] = await Promise.all([
        courseAPI.getCourseDetails(courseId),
        enrollmentAPI.getMyEnrollments(),
      ]);
      
      setCourse(courseRes.data);
      const myEnrollment = enrollmentsRes.data.find(e => e.courseOfferingId === courseId);
      setEnrollment(myEnrollment);
    } catch (error) {
      toast.error('Failed to load course details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = async () => {
    if (!confirm('Are you sure you want to drop this course?')) return;
    
    setDropping(true);
    try {
      await enrollmentAPI.drop(enrollment.id);
      toast.success('Course dropped successfully');
      router.push('/student/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to drop course');
    } finally {
      setDropping(false);
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

  if (!course) {
    return (
      <RouteGuard allowedRoles={['STUDENT']}>
        <DashboardLayout role="STUDENT">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Course not found.</p>
            <Link href="/student/courses" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              ← Back to courses
            </Link>
          </div>
        </DashboardLayout>
      </RouteGuard>
    );
  }

  const canDrop = enrollment && (enrollment.status === 'ENROLLED' || enrollment.status === 'PENDING_ADVISOR_APPROVAL');

  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <DashboardLayout role="STUDENT">
        <div className="space-y-6">
          <div>
            <Link href="/student/courses" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
              ← Back to courses
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{course.courseCode}</h1>
                <p className="text-xl text-gray-600 mt-1">{course.courseTitle}</p>
              </div>
              {enrollment && <StatusBadge status={enrollment.status} />}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Course Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Information</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Course Code</p>
                    <p className="font-medium text-gray-900">{course.courseCode}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Slot</p>
                    <p className="font-medium text-gray-900">{course.slot}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Department</p>
                    <p className="font-medium text-gray-900">{course.department}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Course Type</p>
                    <p className="font-medium text-gray-900">{course.courseType.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Semester</p>
                    <p className="font-medium text-gray-900">{course.semester.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Instructor</p>
                    <p className="font-medium text-gray-900">{course.instructor?.user?.name}</p>
                  </div>
                </div>
              </div>

              {/* Credits Breakdown */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Credits Breakdown</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">L (Lecture)</p>
                    <p className="text-2xl font-bold text-blue-600">{course.L}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">T (Tutorial)</p>
                    <p className="text-2xl font-bold text-green-600">{course.T}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">P (Practical)</p>
                    <p className="text-2xl font-bold text-purple-600">{course.P}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">C (Credits)</p>
                    <p className="text-2xl font-bold text-orange-600">{course.C}</p>
                  </div>
                </div>
              </div>

              {/* Syllabus */}
              {course.syllabus && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Syllabus</h2>
                  <div className="prose max-w-none">
                    {course.syllabus.startsWith('http') ? (
                      <a href={course.syllabus} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        View Syllabus PDF
                      </a>
                    ) : (
                      <p className="text-gray-700 whitespace-pre-wrap">{course.syllabus}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Eligibility */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Eligibility</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-gray-500">Allowed Branches</p>
                    <p className="font-medium text-gray-900">
                      {course.allowedBranches.length > 0 ? course.allowedBranches.join(', ') : 'All branches'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Allowed Entry Years</p>
                    <p className="font-medium text-gray-900">
                      {course.allowedYears.length > 0 ? course.allowedYears.join(', ') : 'All years'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Approval Status Timeline */}
              {enrollment && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Approval Status</h2>
                  <div className="space-y-4">
                    <div className={`flex items-center ${enrollment.status !== 'REJECTED' && (enrollment.instructorApprovedAt || enrollment.status === 'PENDING_INSTRUCTOR_APPROVAL') ? 'opacity-100' : 'opacity-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${enrollment.instructorApprovedAt ? 'bg-green-500 text-white' : enrollment.status === 'PENDING_INSTRUCTOR_APPROVAL' ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        {enrollment.instructorApprovedAt ? '✓' : '1'}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Instructor Approval</p>
                        {enrollment.instructorApprovedAt && (
                          <p className="text-xs text-gray-500">{new Date(enrollment.instructorApprovedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <div className={`flex items-center ${enrollment.status === 'PENDING_ADVISOR_APPROVAL' || enrollment.status === 'ENROLLED' ? 'opacity-100' : 'opacity-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${enrollment.advisorApprovedAt ? 'bg-green-500 text-white' : enrollment.status === 'PENDING_ADVISOR_APPROVAL' ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        {enrollment.advisorApprovedAt ? '✓' : '2'}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Advisor Approval</p>
                        {enrollment.advisorApprovedAt && (
                          <p className="text-xs text-gray-500">{new Date(enrollment.advisorApprovedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <div className={`flex items-center ${enrollment.status === 'ENROLLED' ? 'opacity-100' : 'opacity-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${enrollment.enrolledAt ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                        {enrollment.enrolledAt ? '✓' : '3'}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">Enrolled</p>
                        {enrollment.enrolledAt && (
                          <p className="text-xs text-gray-500">{new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              {canDrop && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
                  <button
                    onClick={handleDrop}
                    disabled={dropping}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {dropping ? 'Dropping...' : 'Drop Course'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
