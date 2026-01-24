export default function StatusBadge({ status }) {
  const statusConfig = {
    PENDING_INSTRUCTOR_APPROVAL: {
      label: 'Pending Instructor',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    PENDING_ADVISOR_APPROVAL: {
      label: 'Pending Advisor',
      className: 'bg-orange-100 text-orange-800 border-orange-300',
    },
    ENROLLED: {
      label: 'Enrolled',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    REJECTED: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
    DROPPED: {
      label: 'Dropped',
      className: 'bg-gray-100 text-gray-800 border-gray-300',
    },
    PENDING_ADMIN_APPROVAL: {
      label: 'Pending Admin',
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    ACTIVE: {
      label: 'Active',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    INACTIVE: {
      label: 'Inactive',
      className: 'bg-gray-100 text-gray-800 border-gray-300',
    },
  };

  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
