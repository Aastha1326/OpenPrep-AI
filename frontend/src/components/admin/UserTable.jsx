import React, { useState } from 'react';
import { Search, Ban, ShieldAlert, Award, ChevronLeft, ChevronRight, Loader } from 'lucide-react';

const UserTable = ({
  users,
  pagination,
  search,
  onSearchChange,
  onPageChange,
  onRoleUpdate,
  onUserDelete,
  loading,
}) => {
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await onRoleUpdate(userId, newRole);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to ban/delete this user? All user data will be wiped permanently.')) {
      setDeletingId(userId);
      try {
        await onUserDelete(userId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'contributor':
        return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-850 dark:text-neutral-350 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      {/* Table Header / Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold font-playfair text-[#1F150C] dark:text-[#E1DCC9]">
            User Accounts Directory
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Promote peers, modify permissions, or block users from accessing services.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded-xl text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm transition"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-x-auto min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400 gap-3">
            <Loader className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-semibold">Scanning directory...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-neutral-400">
            No users match your query parameters.
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-850 text-neutral-400 dark:text-neutral-500 font-semibold text-xs uppercase tracking-wider">
                <th className="pb-3 pr-4 font-semibold">User Details</th>
                <th className="pb-3 px-4 font-semibold">Role</th>
                <th className="pb-3 px-4 font-semibold">Joined Date</th>
                <th className="pb-3 pl-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">{u.name}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{u.email}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center border px-2 py-0.5 rounded-full text-[10px] font-bold ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Promote to Contributor */}
                      {u.role === 'student' && (
                        <button
                          onClick={() => handleRoleChange(u.id, 'contributor')}
                          disabled={updatingId === u.id}
                          className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Promote to Contributor"
                        >
                          <Award className="w-4 h-4" />
                        </button>
                      )}

                      {/* Demote to Student */}
                      {u.role === 'contributor' && (
                        <button
                          onClick={() => handleRoleChange(u.id, 'student')}
                          disabled={updatingId === u.id}
                          className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Demote to Student"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      )}

                      {/* Ban / Delete */}
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Ban User"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center border-t border-neutral-100 dark:border-neutral-850 pt-4 mt-4">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition text-neutral-700 dark:text-neutral-300"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition text-neutral-700 dark:text-neutral-300"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UserTable;
