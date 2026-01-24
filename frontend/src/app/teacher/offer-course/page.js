'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import { courseAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const SLOTS = ['PC1', 'PC2', 'PC3', 'PC4', 'PCE1', 'PCE2', 'PCE3', 'HSME', 'HSPE', 'PEOE', 'PCPE', 'PCDE', 'PHSME'];
const COURSE_TYPES = ['CORE', 'PROGRAM_ELECTIVE', 'OPEN_ELECTIVE', 'SCIENCE_MATH_ELECTIVE', 'HS_ELECTIVE'];
const SEMESTERS = ['SPRING_2025', 'FALL_2025'];

export default function OfferCourse() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseCode: '',
    courseTitle: '',
    department: '',
    semester: 'SPRING_2025',
    courseType: 'CORE',
    slot: 'PC1',
    L: 3,
    P: 0,
    allowedBranches: [],
    allowedYears: [],
    syllabus: '',
  });

  const [branchInput, setBranchInput] = useState('');
  const [yearInput, setYearInput] = useState('');

  const calculateCredits = () => {
    const L = parseFloat(formData.L) || 0;
    const P = parseFloat(formData.P) || 0;
    const T = L / 3;
    const C = L + P / 2;
    return { T: T.toFixed(2), C: C.toFixed(2) };
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddBranch = () => {
    if (branchInput.trim() && !formData.allowedBranches.includes(branchInput.trim())) {
      setFormData({
        ...formData,
        allowedBranches: [...formData.allowedBranches, branchInput.trim()],
      });
      setBranchInput('');
    }
  };

  const handleRemoveBranch = (branch) => {
    setFormData({
      ...formData,
      allowedBranches: formData.allowedBranches.filter(b => b !== branch),
    });
  };

  const handleAddYear = () => {
    const year = parseInt(yearInput);
    if (year && !formData.allowedYears.includes(year)) {
      setFormData({
        ...formData,
        allowedYears: [...formData.allowedYears, year],
      });
      setYearInput('');
    }
  };

  const handleRemoveYear = (year) => {
    setFormData({
      ...formData,
      allowedYears: formData.allowedYears.filter(y => y !== year),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure L and P are sent as integers
      const submitData = {
        ...formData,
        L: parseInt(formData.L, 10) || 0,
        P: parseInt(formData.P, 10) || 0,
      };
      await courseAPI.createOffering(submitData);
      toast.success('Course offering created! Status: Pending Admin Approval');
      router.push('/teacher/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create course offering');
    } finally {
      setLoading(false);
    }
  };

  const credits = calculateCredits();

  return (
    <RouteGuard allowedRoles={['TEACHER']}>
      <DashboardLayout role="TEACHER">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Offer New Course</h1>
            <p className="mt-2 text-gray-600">Create a new course offering for approval</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="CS101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  name="courseTitle"
                  value={formData.courseTitle}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Introduction to Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester *
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {SEMESTERS.map(sem => (
                    <option key={sem} value={sem}>{sem.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Type *
                </label>
                <select
                  name="courseType"
                  value={formData.courseType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {COURSE_TYPES.map(type => (
                    <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slot *
                </label>
                <select
                  name="slot"
                  value={formData.slot}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  L (Lecture hours/week) *
                </label>
                <input
                  type="number"
                  name="L"
                  value={formData.L}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  P (Practical hours/week) *
                </label>
                <input
                  type="number"
                  name="P"
                  value={formData.P}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Credits Display (read-only) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Calculated Credits</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">T (Tutorial): </span>
                  <span className="font-medium">{credits.T}</span>
                </div>
                <div>
                  <span className="text-gray-600">C (Credits): </span>
                  <span className="font-medium">{credits.C}</span>
                </div>
              </div>
            </div>

            {/* Allowed Branches */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Branches (leave empty for all branches)
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Branch to Add</option>
                  <option value="CSE">CSE</option>
                  <option value="AI">AI</option>
                  <option value="CHE">CHE</option>
                  <option value="CE">CE</option>
                  <option value="MEB">MEB</option>
                  <option value="MMB">MMB</option>
                  <option value="EP">EP</option>
                  <option value="EE">EE</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddBranch}
                  disabled={!branchInput}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {formData.allowedBranches.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.allowedBranches.map(branch => (
                    <span
                      key={branch}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {branch}
                      <button
                        type="button"
                        onClick={() => handleRemoveBranch(branch)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Allowed Years */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Entry Years (leave empty for all years)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddYear())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2023"
                  min="2020"
                  max="2030"
                />
                <button
                  type="button"
                  onClick={handleAddYear}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Add
                </button>
              </div>
              {formData.allowedYears.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.allowedYears.map(year => (
                    <span
                      key={year}
                      className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {year}
                      <button
                        type="button"
                        onClick={() => handleRemoveYear(year)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Syllabus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Syllabus (optional)
              </label>
              <textarea
                name="syllabus"
                value={formData.syllabus}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter syllabus text or URL..."
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Creating...' : 'Create Course Offering'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </RouteGuard>
  );
}
