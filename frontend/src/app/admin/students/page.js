'use client';

import { useEffect, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pendingRes, studentsRes, teachersRes] = await Promise.all([
        adminAPI.getPendingStudents(),
        adminAPI.getAllStudents(),
        adminAPI.getAllTeachers(),
      ]);
      setPendingStudents(pendingRes.data || []);
      setAllStudents(studentsRes.data || []);
      setTeachers(teachersRes.data || []);
    } catch (error) {
      toast.error('Failed to load students data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId) => {
    setActionLoading(studentId);
    try {
      await adminAPI.approveStudent(studentId);
      toast.success('Student approved successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve student');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (studentId) => {
    if (!confirm('Are you sure you want to reject this student?')) return;
    
    setActionLoading(studentId);
    try {
      await adminAPI.rejectStudent(studentId);
      toast.success('Student rejected');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject student');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignAdvisor = async (studentId, advisorId) => {
    setActionLoading(studentId);
    try {
      await adminAPI.assignAdvisor(studentId, advisorId);
      toast.success('Advisor assigned successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign advisor');
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

  const displayStudents = showAll ? allStudents : pendingStudents;

  return (
    <RouteGuard allowedRoles={['ADMIN']}>
      <DashboardLayout role="ADMIN">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
              <p className="mt-2 text-gray-600">Approve, reject, and manage students</p>
            </div>
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              {showAll ? 'Show Pending Only' : 'Show All Students'}
            </button>
          </div>

          {displayStudents.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No {showAll ? '' : 'pending '}students found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Advisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayStudents.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.student?.rollNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.student?.branch || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.student?.entryYear || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.student?.advisor?.user?.name || (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignAdvisor(user.id, e.target.value);
                              }
                            }}
                            disabled={actionLoading === user.id}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            defaultValue=""
                          >
                            <option value="">Assign Advisor</option>
                            {teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.user?.name} ({teacher.department})
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {user.status === 'PENDING_ADMIN_APPROVAL' && (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              disabled={actionLoading === user.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
