'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { courseAPI, enrollmentAPI, gradeAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TeacherCourseDetails() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId;

  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState({ instructor: [], advisor: [] });
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [gradeForm, setGradeForm] = useState({});

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const courseRes = await courseAPI.getCourseDetails(courseId);
      setCourse(courseRes.data);
      
      // Organize enrollments from course data
      const instructorPending = courseRes.data.enrollmentRequests?.filter(
        e => e.status === 'PENDING_INSTRUCTOR_APPROVAL'
      ) || [];
      const advisorPending = courseRes.data.enrollmentRequests?.filter(
        e => e.status === 'PENDING_ADVISOR_APPROVAL'
      ) || [];
      
      setEnrollments({
        instructor: instructorPending,
        advisor: advisorPending,
      });

      // Fetch grades
      try {
        const gradesRes = await gradeAPI.getByCourse(courseId);
        setGrades(gradesRes.data || []);
      } catch (error) {
        // Grades might not exist yet
      }
    } catch (error) {
      toast.error('Failed to load course data');
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
      } else {
        await enrollmentAPI.approveAdvisor(enrollmentId);
      }
      toast.success('Enrollment approved');
      fetchCourseData();
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
      toast.success('Enrollment rejected');
      fetchCourseData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject enrollment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setGradeForm({
      ...gradeForm,
      [studentId]: {
        ...gradeForm[studentId],
        [field]: value,
      },
    });
  };

  const handleSaveGrade = async (studentId) => {
    const gradeData = gradeForm[studentId];
    if (!gradeData) return;

    try {
      await gradeAPI.assign({
        studentId,
        courseOfferingId: courseId,
        grade: gradeData.grade || null,
        marks: gradeData.marks ? parseFloat(gradeData.marks) : null,
      });
      toast.success('Grade saved successfully');
      fetchCourseData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save grade');
    }
  };

  const handlePublishGrade = async (gradeId) => {
    try {
      await gradeAPI.publish(gradeId);
      toast.success('Grade published');
      fetchCourseData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to publish grade');
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

  if (!course) {
    return (
      <RouteGuard allowedRoles={['TEACHER']}>
        <DashboardLayout role="TEACHER">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Course not found.</p>
          </div>
        </DashboardLayout>
      </RouteGuard>
    );
  }

  const enrolledStudents = course.enrollmentRequests?.filter(e => e.status === 'ENROLLED') || [];

  return (
    <RouteGuard allowedRoles={['TEACHER']}>
      <DashboardLayout role="TEACHER">
        <div className="space-y-6">
          <div>
            <Link href="/teacher/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
              ← Back to dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{course.courseCode}</h1>
            <p className="text-xl text-gray-600 mt-1">{course.courseTitle}</p>
          </div>

          {/* Pending Requests */}
          {(enrollments.instructor.length > 0 || enrollments.advisor.length > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Enrollment Requests</h2>
              
              {enrollments.instructor.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Pending Instructor Approval</h3>
                  <div className="space-y-2">
                    {enrollments.instructor.map((enrollment) => (
                      <div key={enrollment.id} className="bg-white rounded p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{enrollment.student?.user?.name}</p>
                          <p className="text-sm text-gray-500">{enrollment.student?.user?.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(enrollment.id, 'instructor')}
                            disabled={actionLoading === enrollment.id}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(enrollment.id)}
                            disabled={actionLoading === enrollment.id}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {enrollments.advisor.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Pending Advisor Approval</h3>
                  <div className="space-y-2">
                    {enrollments.advisor.map((enrollment) => (
                      <div key={enrollment.id} className="bg-white rounded p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{enrollment.student?.user?.name}</p>
                          <p className="text-sm text-gray-500">{enrollment.student?.user?.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(enrollment.id, 'advisor')}
                            disabled={actionLoading === enrollment.id}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(enrollment.id)}
                            disabled={actionLoading === enrollment.id}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enrolled Students & Grades */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Enrolled Students & Grades</h2>
            {enrolledStudents.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No enrolled students yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrolledStudents.map((enrollment) => {
                      const existingGrade = grades.find(g => g.studentId === enrollment.studentId);
                      const formData = gradeForm[enrollment.studentId] || {
                        grade: existingGrade?.grade || '',
                        marks: existingGrade?.marks || '',
                      };

                      return (
                        <tr key={enrollment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {enrollment.student?.user?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {enrollment.student?.user?.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={formData.grade}
                              onChange={(e) => handleGradeChange(enrollment.studentId, 'grade', e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="A+, A, B+..."
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={formData.marks}
                              onChange={(e) => handleGradeChange(enrollment.studentId, 'marks', e.target.value)}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="0-100"
                              min="0"
                              max="100"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleSaveGrade(enrollment.studentId)}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              Save
                            </button>
                            {existingGrade && !existingGrade.isPublished && (
                              <button
                                onClick={() => handlePublishGrade(existingGrade.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                Publish
                              </button>
                            )}
                            {existingGrade?.isPublished && (
                              <span className="text-green-600 text-xs">Published</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
