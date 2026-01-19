'use client';

import { useEffect, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { studentAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await studentAPI.getTimetable();
      setTimetable(res.data || []);
    } catch (error) {
      toast.error('Failed to load timetable');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    { slot: 0, time: '8:00 - 8:50' },
    { slot: 1, time: '9:00 - 9:50' },
    { slot: 2, time: '10:00 - 10:50' },
    { slot: 3, time: '11:00 - 11:50' },
    { slot: 4, time: '12:00 - 12:50' },
    { slot: 5, time: '2:00 - 2:50' },
    { slot: 6, time: '3:00 - 3:50' },
    { slot: 7, time: '4:00 - 4:50' },
    { slot: 8, time: '5:00 - 5:50' },
    { slot: 9, time: '6:00 - 6:50' },
  ];

  // Create timetable grid
  const getCourseForSlot = (day, timeSlot) => {
    return timetable.find(
      (entry) => entry.day === day && entry.timeSlot === timeSlot
    );
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

  const enrolledCount = new Set(timetable.map(t => t.courseCode)).size;

  return (
    <RouteGuard allowedRoles={['STUDENT']}>
      <DashboardLayout role="STUDENT">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Timetable</h1>
            <p className="mt-2 text-gray-600">
              {enrolledCount > 0 
                ? `Showing ${enrolledCount} enrolled ${enrolledCount === 1 ? 'course' : 'courses'}`
                : 'No enrolled courses yet'}
            </p>
          </div>

          {enrolledCount === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No enrolled courses to display in timetable.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Time
                      </th>
                      {days.map((day) => (
                        <th
                          key={day}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeSlots.map((ts) => (
                      <tr key={ts.slot}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                          {ts.time}
                        </td>
                        {days.map((_, dayIndex) => {
                          const course = getCourseForSlot(dayIndex, ts.slot);
                          return (
                            <td
                              key={dayIndex}
                              className={`px-4 py-3 text-sm ${
                                course ? 'bg-blue-50 border border-blue-200' : ''
                              }`}
                            >
                              {course && (
                                <div>
                                  <p className="font-semibold text-gray-900">{course.courseCode}</p>
                                  {course.courseTitle && (
                                    <p className="text-xs text-gray-600 mt-1">{course.courseTitle}</p>
                                  )}
                                  {course.instructor && (
                                    <p className="text-xs text-gray-500 mt-1">{course.instructor}</p>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
