'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getToken } from '@/lib/auth';

export default function RouteGuard({ children, allowedRoles = [] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const userData = await getCurrentUser();
        if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
          // Redirect based on role
          if (userData.role === 'STUDENT') {
            router.push('/student/dashboard');
          } else if (userData.role === 'TEACHER') {
            router.push('/teacher/dashboard');
          } else if (userData.role === 'ADMIN') {
            router.push('/admin/dashboard');
          } else {
            router.push('/login');
          }
          return;
        }
        setUser(userData);
      } catch (error) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
