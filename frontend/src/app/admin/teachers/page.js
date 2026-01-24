'use client';

import { useEffect, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const [allTeachersRes, pendingRes] = await Promise.all([
        adminAPI.getAllTeachers(),
        adminAPI.getPendingTeachers(),
      ]);
      setTeachers(allTeachersRes.data || []);
      setPendingTeachers(pendingRes.data || []);
    } catch (error) {
      toast.error('Failed to load teachers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setActionLoading('add');
    try {
      await adminAPI.createTeacher(formData);
      toast.success('Teacher created successfully');
      setFormData({ name: '', email: '', password: '', department: '' });
      setShowAddForm(false);
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create teacher');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveTeacher = async (teacherId) => {
    setActionLoading(teacherId);
    try {
      await adminAPI.approveTeacher(teacherId);
      toast.success('Teacher approved successfully');
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve teacher');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTeacher = async (teacherId) => {
    if (!confirm('Are you sure you want to reject this teacher?')) return;
    
    setActionLoading(teacherId);
    try {
      await adminAPI.rejectTeacher(teacherId);
      toast.success('Teacher rejected');
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject teacher');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveTeacher = async (teacherId) => {
    if (!confirm('Are you sure you want to remove this teacher?')) return;
    
    setActionLoading(teacherId);
    try {
      await adminAPI.removeTeacher(teacherId);
      toast.success('Teacher removed successfully');
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove teacher');
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
              <p className="mt-2 text-gray-600">Add, remove, and manage teachers</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {showAddForm ? 'Cancel' : '+ Add Teacher'}
            </button>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Teacher</h2>
              <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">CSE</option>
                    <option value="AI">AI</option>
                    <option value="CHE">CHE</option>
                    <option value="CE">CE</option>
                    <option value="MEB">MEB</option>
                    <option value="MMB">MMB</option>
                    <option value="EP">EP</option>
                    <option value="EE">EE</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={actionLoading === 'add'}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {actionLoading === 'add' ? 'Creating...' : 'Create Teacher'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Pending Teacher Approvals */}
          {pendingTeachers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Teacher Approvals</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="space-y-4">
                  {pendingTeachers.map((user) => (
                    <div key={user.id} className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                          <StatusBadge status={user.status} />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveTeacher(user.id)}
                            disabled={actionLoading === user.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === user.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectTeacher(user.id)}
                            disabled={actionLoading === user.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === user.id ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {teachers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No teachers found.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Advised Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{teacher.user?.name}</p>
                          <p className="text-sm text-gray-500">{teacher.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teacher.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teacher.advisedStudents?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={teacher.user?.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRemoveTeacher(teacher.user?.id)}
                          disabled={actionLoading === teacher.user?.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          Remove
                        </button>
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
