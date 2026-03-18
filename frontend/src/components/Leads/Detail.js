import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/store";
import { leadsAPI, activitiesAPI } from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { MoreVertical, Edit, Trash2, Plus, ArrowLeft } from "react-feather";

export default function LeadDetail() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityFormData, setActivityFormData] = useState({
    type: "note",
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchLead();
    fetchActivities();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await leadsAPI.getLead(id);
      setLead(response.data);
    } catch (error) {
      console.error("Error fetching lead:", error);
      navigate("/leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await activitiesAPI.getActivities(id);
      setActivities(response.data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    try {
      await activitiesAPI.createActivity({ ...activityFormData, lead: id });
      setActivityFormData({ type: "note", title: "", description: "" });
      setShowActivityForm(false);
      fetchActivities();
    } catch (error) {
      console.error("Error creating activity:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await leadsAPI.deleteLead(id);
        navigate("/leads");
      } catch (error) {
        console.error("Error deleting lead:", error);
      }
    }
  };

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

  if (loading) return <div className="text-center py-8">Loading...</div>;

  if (!lead) return <div className="text-center py-8">Lead not found</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {lead.name}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}
            >
              {lead.status}
            </span>
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Lead Details - {lead.company || "No company"}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate(`/leads/${id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Lead Information
              </h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lead.name}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {lead.email}
                    </a>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      "-"
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Company</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {lead.company || "-"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Assigned To
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {lead.assigned_to?.name || "Unassigned"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Created By
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {lead.created_by?.name || "System"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Created At
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Activities
                </h2>
                <button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </button>
              </div>

              {showActivityForm && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <form onSubmit={handleActivitySubmit}>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={activityFormData.type}
                          onChange={(e) =>
                            setActivityFormData({
                              ...activityFormData,
                              type: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="call">Call</option>
                          <option value="email">Email</option>
                          <option value="meeting">Meeting</option>
                          <option value="note">Note</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={activityFormData.title}
                          onChange={(e) =>
                            setActivityFormData({
                              ...activityFormData,
                              title: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Activity title"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={activityFormData.description}
                          onChange={(e) =>
                            setActivityFormData({
                              ...activityFormData,
                              description: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          rows={3}
                          placeholder="Activity description"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowActivityForm(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Add Activity
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {activity.description || "No description"}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {activity.type}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/leads/${id}/edit`)}
                  className="w-full flex items-center justify-between px-4 py-2 border border-transparent text-left text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span>Edit Lead</span>
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-between px-4 py-2 border border-transparent text-left text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span>Delete Lead</span>
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <span>Print Lead</span>
                  <DocumentTextIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
