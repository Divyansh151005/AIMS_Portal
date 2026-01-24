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
      // Only show PENDING_INSTRUCTOR_APPROVAL requests to the course instructor
      // PENDING_ADVISOR_APPROVAL requests should only be visible to the student's advisor, not the course instructor
      const instructorPending = courseRes.data.enrollmentRequests?.filter(
        e => e.status === 'PENDING_INSTRUCTOR_APPROVAL'
      ) || [];
      
      setEnrollments({
        instructor: instructorPending,
        advisor: [], // Don't show advisor approval requests to course instructor
      });

      // Fetch grades
      try {
        const gradesRes = await gradeAPI.getByCourse(courseId);
        const fetchedGrades = gradesRes.data || [];
        setGrades(fetchedGrades);
        
        // Initialize form data with existing grades
        const initialFormData = {};
        fetchedGrades.forEach(grade => {
          initialFormData[grade.studentId] = {
            grade: grade.grade || '',
            marks: grade.marks !== null && grade.marks !== undefined ? grade.marks.toString() : '',
          };
        });
        setGradeForm(initialFormData);
      } catch (error) {
        // Grades might not exist yet
        console.error('Error fetching grades:', error);
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
    const currentFormData = gradeForm[studentId] || {};
    setGradeForm({
      ...gradeForm,
      [studentId]: {
        ...currentFormData,
        [field]: value,
      },
    });
    console.log('Grade form updated:', { studentId, field, value, formData: { ...currentFormData, [field]: value } });
  };

  const handleSaveGrade = async (studentId) => {
    // Get form data or initialize from existing grade
    const existingGrade = grades.find(g => g.studentId === studentId);
    const gradeData = gradeForm[studentId] || {
      grade: existingGrade?.grade || '',
      marks: existingGrade?.marks !== null && existingGrade?.marks !== undefined ? existingGrade.marks.toString() : '',
    };
    
    if (!gradeData || (!gradeData.grade && !gradeData.marks)) {
      toast.error('Please enter either a grade or marks to save');
      return;
    }

    try {
      // Check if grade already exists - if so, update it; otherwise create it
      const existingGrade = grades.find(g => g.studentId === studentId);
      
      // Process grade and marks - handle empty strings properly
      const gradeValue = gradeData.grade?.trim() || null;
      let marksValue = null;
      if (gradeData.marks && gradeData.marks !== '' && gradeData.marks !== null) {
        const parsed = parseFloat(gradeData.marks);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          marksValue = parsed;
        } else {
          toast.error('Marks must be a number between 0 and 100');
          return;
        }
      }
      
      console.log('Saving grade:', { studentId, courseId, gradeValue, marksValue, existingGrade: existingGrade?.id });
      
      if (existingGrade && existingGrade.id) {
        // Update existing grade
        const response = await gradeAPI.update(existingGrade.id, {
          grade: gradeValue,
          marks: marksValue,
        });
        console.log('Grade update response:', response);
      } else {
        // Create new grade
        const response = await gradeAPI.assign({
          studentId,
          courseOfferingId: courseId,
          grade: gradeValue,
          marks: marksValue,
        });
        console.log('Grade assign response:', response);
      }
      toast.success('Grade saved successfully');
      // Refresh course data to show updated grades
      await fetchCourseData();
    } catch (error) {
      console.error('Save grade error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.errors?.[0]?.msg || 
                          error.message || 
                          'Failed to save grade';
      toast.error(errorMessage);
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
                        marks: existingGrade?.marks !== null && existingGrade?.marks !== undefined ? existingGrade.marks.toString() : '',
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
                            <div className="flex flex-col gap-2">
                              <div>
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
                              </div>
                              <button
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to drop ${enrollment.student?.user?.name} from this course?`)) {
                                    try {
                                      await enrollmentAPI.dropStudent(enrollment.id);
                                      toast.success('Student dropped from course successfully');
                                      fetchCourseData();
                                    } catch (error) {
                                      toast.error(error.response?.data?.error || 'Failed to drop student');
                                    }
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Drop Student
                              </button>
                            </div>
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
