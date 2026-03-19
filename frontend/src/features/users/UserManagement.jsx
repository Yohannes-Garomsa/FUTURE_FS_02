import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "../../services/api";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: fetchResponse = { data: [] }, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => await usersAPI.getUsers(),
  });

  const users = fetchResponse.data || [];

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => usersAPI.assignRole(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
    },
    onError: (error) => {
      console.error("Failed to assign role:", error);
      alert("Failed to assign role.");
    },
  });

  const handleRoleChange = (userId, newRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      assignRoleMutation.mutate({ userId, role: newRole });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading users...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 h-full bg-gray-50 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">Manage user access and roles.</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {u.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {u.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {u.role || "agent"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    value={u.role || "agent"}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={assignRoleMutation.isLoading}
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
  );
}
