import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/store";
import { leadsAPI, activitiesAPI } from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { Edit, Trash2, Plus, ArrowLeft } from "react-feather";

export default function LeadDetail() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityFormData, setActivityFormData] = useState({
    activity_type: "note",
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchLead();
    fetchActivities();
    fetchAttachments();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await leadsAPI.getLead(id);
      setLead(response.data);
    } catch (error) {
      toast.error("Error fetching lead.");
      navigate("/leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await activitiesAPI.getActivities(id);
      setActivities(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchAttachments = async () => {
    try {
      const response = await leadsAPI.getAttachments(id);
      setAttachments(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    }
  };

  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    try {
      await activitiesAPI.createActivity({ ...activityFormData, lead: id });
      setActivityFormData({ activity_type: "note", title: "", description: "" });
      setShowActivityForm(false);
      fetchActivities();
      toast.success("Activity added.");
    } catch (error) {
      toast.error("Failed to add activity.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_name", file.name);

    try {
      await leadsAPI.uploadAttachment(id, formData);
      fetchAttachments();
      toast.success("File uploaded successfully.");
    } catch (error) {
      toast.error("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this lead?")) {
      try {
        await leadsAPI.deleteLead(id);
        toast.success("Lead deleted.");
        navigate("/leads");
      } catch (error) {
        toast.error("Failed to delete lead.");
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal: "bg-indigo-100 text-indigo-800",
      negotiation: "bg-purple-100 text-purple-800",
      converted: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: "text-red-600 font-bold",
      high: "text-orange-500 font-semibold",
      medium: "text-blue-500 font-medium",
      low: "text-gray-500 font-normal",
    };
    return colors[priority] || "text-gray-500";
  };

  if (loading) return (
     <div className="flex-1 flex items-center justify-center p-8">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
     </div>
  );

  if (!lead) return <div className="text-center py-8">Lead not found</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 h-full bg-gray-50">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => navigate("/leads")} className="text-gray-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {lead.full_name}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(lead.status)} uppercase tracking-wider`}>
              {lead.status}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {lead.company || "No company"} &bull; Added {new Date(lead.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={() => navigate(`/leads/${id}/edit`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Information Section */}
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <h2 className="text-lg font-semibold text-gray-900 border-l-4 border-indigo-500 pl-3">Lead Information</h2>
              <span className={`text-xs uppercase tracking-widest ${getPriorityColor(lead.priority)}`}>
                {lead.priority || "Medium"} Priority
              </span>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                   <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</dt>
                   <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:text-indigo-800 hover:underline">{lead.email}</a>
                   </dd>
                </div>
                <div>
                   <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</dt>
                   <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {lead.phone ? <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a> : "-"}
                   </dd>
                </div>
                <div>
                   <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</dt>
                   <dd className="mt-1 flex items-center text-sm text-gray-900 capitalize">{lead.source?.replace('_', ' ') || "-"}</dd>
                </div>
                <div>
                   <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Value</dt>
                   <dd className="mt-1 flex items-center text-sm text-gray-900 font-semibold">
                      ${lead.deal_value || "0.00"}
                   </dd>
                </div>
                <div>
                   <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Agent</dt>
                   <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {lead.assigned_to_name || "Unassigned"}
                   </dd>
                </div>
                <div>
                   <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Activity</dt>
                   <dd className="mt-1 flex items-center text-sm text-gray-900">
                      <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {lead.last_activity_at ? new Date(lead.last_activity_at).toLocaleDateString() : "No activity"}
                   </dd>
                </div>
              </dl>
              {lead.notes && (
                 <div className="mt-8 pt-6 border-t border-gray-100">
                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Internal Notes</dt>
                    <dd className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg italic">
                      {lead.notes}
                    </dd>
                 </div>
              )}
            </div>
          </div>

          {/* Activities Section */}
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
               <h2 className="text-lg font-semibold text-gray-900 border-l-4 border-indigo-500 pl-3">Activities</h2>
               <button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-105"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  LOG ACTIVITY
                </button>
            </div>

            <div className="p-6">
              {showActivityForm && (
                <div className="bg-gray-50 rounded-xl p-5 mb-8 ring-1 ring-gray-200">
                  <form onSubmit={handleActivitySubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Activity Type</label>
                        <select
                          value={activityFormData.activity_type}
                          onChange={(e) => setActivityFormData({ ...activityFormData, activity_type: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="call">Call</option>
                          <option value="email">Email</option>
                          <option value="meeting">Meeting</option>
                          <option value="note">Note</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Title</label>
                        <input
                          type="text"
                          value={activityFormData.title}
                          onChange={(e) => setActivityFormData({ ...activityFormData, title: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 sm:text-sm"
                          placeholder="What happened?"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Details</label>
                        <textarea
                          value={activityFormData.description}
                          onChange={(e) => setActivityFormData({ ...activityFormData, description: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-indigo-500 sm:text-sm"
                          rows={3}
                          placeholder="Describe the activity..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button type="button" onClick={() => setShowActivityForm(false)} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700">Add Log</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
                {activities.length > 0 ? activities.map((activity) => (
                  <div key={activity.id} className="relative pl-8">
                    <span className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-white ring-2 ring-gray-100 flex items-center justify-center">
                       {activity.activity_type === 'call' && <PhoneIcon className="h-3 w-3 text-indigo-500" />}
                       {activity.activity_type === 'email' && <EnvelopeIcon className="h-3 w-3 text-indigo-500" />}
                       {activity.activity_type === 'meeting' && <CalendarIcon className="h-3 w-3 text-indigo-500" />}
                       {activity.activity_type === 'note' && <DocumentTextIcon className="h-3 w-3 text-indigo-500" />}
                    </span>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{activity.title}</h4>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-400 font-medium">
                          <span className="capitalize px-1.5 py-0.5 bg-gray-100 rounded mr-3">{activity.activity_type}</span>
                          &bull; Logged by {activity.created_by_name} &bull; {new Date(activity.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-400 py-4 text-sm italic">No activities logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/20">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Management</h2>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => navigate(`/leads/${id}/edit`)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all group"
              >
                <span>Edit Profile</span>
                <Edit className="h-4 w-4 group-hover:scale-110" />
              </button>
              {(user?.role === "admin" || user?.role === "manager") && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-all group"
                >
                  <span>Terminate Lead</span>
                  <Trash2 className="h-4 w-4 group-hover:scale-110" />
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all group"
              >
                <span>Export Details</span>
                <DocumentTextIcon className="h-4 w-4 group-hover:scale-110" />
              </button>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/20">
               <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Files</h2>
               <label className={`cursor-pointer inline-flex items-center px-2 py-1 text-xs font-bold rounded text-white bg-indigo-600 hover:bg-indigo-700 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                 <Plus className="h-3 w-3 mr-1" />
                 UPLOAD
                 <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
               </label>
            </div>
            <div className="p-4">
              {uploading && (
                <div className="flex items-center justify-center p-4">
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                   <span className="text-xs font-bold text-indigo-600 animate-pulse uppercase tracking-widest">Uploading...</span>
                </div>
              )}
              <div className="space-y-3">
                {attachments.length > 0 ? attachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center">
                      <PaperClipIcon className="h-4 w-4 text-gray-400 mr-3" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]" title={file.file_name}>{file.file_name}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{new Date(file.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a href={file.file} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold uppercase ring-1 ring-indigo-100 px-2 py-1 rounded hover:bg-indigo-50">View</a>
                  </div>
                )) : !uploading && (
                  <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">No Documents</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
