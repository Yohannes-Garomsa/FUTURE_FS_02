import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/store";
import { leadsAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export default function Leads() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLeads, setFilteredLeads] = useState([]);

  const { data: fetchResponse = { data: { results: [] } }, isLoading: loading, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => await leadsAPI.getLeads(),
  });

  const leads = fetchResponse.data.results || [];

  useEffect(() => {
    if (leads) {
      if (searchTerm) {
         setFilteredLeads(leads.filter((lead) =>
            lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
         ));
      } else {
         setFilteredLeads(leads);
      }
    }
  }, [leads, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await leadsAPI.deleteLead(id);
        refetch();
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    }
  };

  const canEditOrDelete = user?.role === "admin" || user?.role === "manager";

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      converted: "bg-purple-100 text-purple-800",
      lost: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 bg-gray-50/10 dark:bg-slate-950/20 min-h-full transition-colors duration-500">
      {loading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10">Loading...</div>}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight text-shadow-glow">Leads</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400 font-medium">
            Manage and track your leads, <span className="text-indigo-600 dark:text-indigo-400 font-bold">{user?.full_name}</span>!
          </p>
        </div>
        {canEditOrDelete && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => navigate("/leads/create")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 text-white bg-indigo-600 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Add Lead
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase border-l-4 border-indigo-500 pl-4 text-shadow-glow">All Leads</h2>
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-slate-100 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20 transition-all outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
              <thead className="bg-gray-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    Assigned To
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-50 dark:divide-slate-800">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-slate-100">
                      {lead.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-slate-400">
                      {lead.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-slate-400">
                      {lead.company || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-[10px] font-black uppercase rounded-lg ${getStatusColor(lead.status)}`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-slate-400">
                      {lead.assigned_to_name || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {canEditOrDelete && (
                        <>
                          <button
                            onClick={() => navigate(`/leads/${lead.id}`)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
