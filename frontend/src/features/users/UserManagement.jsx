import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function UserManagement() {
  const queryClient = useQueryClient();

  const { data: fetchResponse, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => await usersAPI.getUsers(),
  });

  const users = fetchResponse?.data?.results || fetchResponse?.data || [];

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => usersAPI.assignRole(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      toast.success("User role updated successfully.");
    },
    onError: (error) => {
      const msg = error.response?.data?.error?.message || "Failed to assign role.";
      toast.error(msg);
    },
  });

  const handleRoleChange = (userId, newRole) => {
      assignRoleMutation.mutate({ userId, role: newRole });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
      contacted: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
      qualified: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
      converted: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
      lost: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
    };
    return colors[status] || "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300";
  };
  const getRoleBadge = (role) => {
    const roles = {
      admin: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
      manager: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300",
      agent: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    };
    return roles[role] || "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300";
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 h-full bg-gray-50 dark:bg-slate-950 transition-colors duration-500">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Manage organizational roles and permissions.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm ring-1 ring-gray-900/5 dark:ring-white/5 overflow-hidden border border-transparent dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                  User Profile
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                  Current Role
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                  Manage Access
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{u.full_name}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-500">ID: {u.id?.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>
                      {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="inline-flex rounded-md bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-white sm:text-sm disabled:opacity-50"
                      disabled={assignRoleMutation.isPending}
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="agent">Sales Agent</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
