'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout, getCurrentUser } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children, role }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        // Error handled by RouteGuard
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const navigation = {
    STUDENT: [
      { name: 'Dashboard', href: '/student/dashboard' },
      { name: 'Courses', href: '/student/courses' },
      { name: 'Grades', href: '/student/grades' },
    ],
    TEACHER: [
      { name: 'Dashboard', href: '/teacher/dashboard' },
      { name: 'Offer Course', href: '/teacher/offer-course' },
      { name: 'My Actions', href: '/teacher/my-actions' },
    ],
    ADMIN: [
      { name: 'Dashboard', href: '/admin/dashboard' },
      { name: 'Students', href: '/admin/students' },
      { name: 'Teachers', href: '/admin/teachers' },
      { name: 'Courses', href: '/admin/courses' },
    ],
  };

  const navItems = navigation[role] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href={`/${role.toLowerCase()}/dashboard`} className="text-xl font-bold text-blue-600">
                  AIMS Portal
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-700">
                  {user.name} ({role})
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
