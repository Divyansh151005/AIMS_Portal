'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, statsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getStats(),
      ]);
      setDashboardData(dashboardRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">System overview and statistics</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link href="/admin/students" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <h3 className="text-sm font-medium text-gray-500">Pending Student Approvals</h3>
              <p className="mt-2 text-3xl font-bold text-yellow-600">{dashboardData?.stats?.pendingStudents || 0}</p>
            </Link>
            <Link href="/admin/teachers" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <h3 className="text-sm font-medium text-gray-500">Pending Teacher Approvals</h3>
              <p className="mt-2 text-3xl font-bold text-purple-600">{dashboardData?.stats?.pendingTeachers || 0}</p>
            </Link>
            <Link href="/admin/courses" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <h3 className="text-sm font-medium text-gray-500">Pending Course Approvals</h3>
              <p className="mt-2 text-3xl font-bold text-orange-600">{dashboardData?.stats?.pendingCourses || 0}</p>
            </Link>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Students</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">{dashboardData?.stats?.activeStudents || 0}</p>
            </div>
          </div>

          {/* System Statistics */}
          {stats && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">System Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.activeStudents} active</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Teachers</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTeachers}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.activeTeachers} active</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCourses}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.approvedCourses} approved</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Enrollments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEnrollments}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
