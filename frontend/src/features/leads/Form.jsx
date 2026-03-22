import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/store";
import { leadsAPI, usersAPI } from "../../services/api";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, Trash2, User, Briefcase, DollarSign, Tag, Info } from "react-feather";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function LeadForm() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [users, setUsers] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: "new",
      priority: "medium",
      source: "other",
      deal_value: 0
    }
  });

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchLead();
    }
    fetchUsers();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await leadsAPI.getLead(id);
      reset(response.data);
    } catch (error) {
      toast.error("Error fetching lead details.");
      navigate("/leads");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getUsers();
      setUsers(response.data.results || response.data);
    } catch (error) {
       console.error("Users fetch error:", error);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    // Cast deal_value to number
    const payload = {
       ...data,
       deal_value: parseFloat(data.deal_value || 0)
    };

    try {
      if (isEdit) {
        await leadsAPI.updateLead(id, payload);
        toast.success("Lead updated successfully!");
      } else {
        await leadsAPI.createLead(payload);
        toast.success("New lead created!");
      }
      navigate("/leads");
    } catch (error) {
      const msg = error.response?.data?.error?.message || "Error saving lead.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this lead?")) {
      try {
        await leadsAPI.deleteLead(id);
        toast.success("Lead eliminated.");
        navigate("/leads");
      } catch (error) {
        toast.error("Deletion failed.");
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 h-full bg-gray-50 flex flex-col">
      <nav className="flex mb-8 items-center text-sm font-medium text-gray-500 whitespace-nowrap">
        <Link to="/leads" className="hover:text-indigo-600 transition-colors">Leads</Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 font-bold">{isEdit ? "Update Lead" : "Add New Lead"}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8">
         <div className="lg:w-1/3 space-y-4">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
               {isEdit ? "Refine Lead" : "Capture Opportunity"}
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
               {isEdit 
                 ? "Update contact details, adjust priority, or re-assign this lead to another sales specialist." 
                 : "Enter the essential details for your new prospective client to start the sales cycle."}
            </p>
            <div className="hidden lg:block pt-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <Info className="text-indigo-600 shrink-0 mt-1" size={18} />
                    <p className="text-xs text-indigo-700 font-medium">
                       Ensuring accurate data entry here improves analytics accuracy in your dashboard and helps managers track performance better.
                    </p>
                </div>
            </div>
         </div>

         <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-gray-100">
                  <div className="p-8 space-y-8">
                     {/* Section 1: Identity */}
                     <section>
                        <div className="flex items-center gap-2 mb-6 text-indigo-600">
                           <User size={18} />
                           <h3 className="text-xs font-bold uppercase tracking-widest">Primary Contact</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                           <div className="group">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">First Name</label>
                              <input
                                {...register("first_name", { required: "First name is mandatory" })}
                                className={`w-full bg-gray-50 border ${errors.first_name ? 'border-red-500 ring-red-100' : 'border-gray-200 focus:border-indigo-500 ring-transparent focus:ring-4 focus:ring-indigo-50'} rounded-xl py-2.5 px-4 outline-none transition-all`}
                                placeholder="e.g. John"
                              />
                              {errors.first_name && <p className="mt-1.5 text-[11px] text-red-500 font-bold uppercase">{errors.first_name.message}</p>}
                           </div>
                           <div className="group">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Last Name</label>
                              <input
                                {...register("last_name", { required: "Last name is mandatory" })}
                                className={`w-full bg-gray-50 border ${errors.last_name ? 'border-red-500 ring-red-100' : 'border-gray-200 focus:border-indigo-500 ring-transparent focus:ring-4 focus:ring-indigo-50'} rounded-xl py-2.5 px-4 outline-none transition-all`}
                                placeholder="e.g. Doe"
                              />
                              {errors.last_name && <p className="mt-1.5 text-[11px] text-red-500 font-bold uppercase">{errors.last_name.message}</p>}
                           </div>
                           <div className="group md:col-span-2">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Email Address</label>
                              <input
                                type="email"
                                {...register("email", { required: "Email is mandatory" })}
                                className={`w-full bg-gray-50 border ${errors.email ? 'border-red-500 ring-red-100' : 'border-gray-200 focus:border-indigo-500 ring-transparent focus:ring-4 focus:ring-indigo-50'} rounded-xl py-2.5 px-4 outline-none transition-all`}
                                placeholder="john.doe@company.com"
                              />
                              {errors.email && <p className="mt-1.5 text-[11px] text-red-500 font-bold uppercase">{errors.email.message}</p>}
                           </div>
                           <div className="group">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Phone Number</label>
                              <input
                                {...register("phone")}
                                className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-xl py-2.5 px-4 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm"
                                placeholder="+1 (555) 000-0000"
                              />
                           </div>
                           <div className="group">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Job Title</label>
                              <input
                                {...register("job_title")}
                                className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-xl py-2.5 px-4 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm"
                                placeholder="e.g. VP Marketing"
                              />
                           </div>
                        </div>
                     </section>

                     {/* Section 2: Business details */}
                     <section>
                        <div className="flex items-center gap-2 mb-6 text-indigo-600">
                           <Briefcase size={18} />
                           <h3 className="text-xs font-bold uppercase tracking-widest">Business Context</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                           <div className="group">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Company Name</label>
                              <input
                                {...register("company")}
                                className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-xl py-2.5 px-4 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm"
                                placeholder="Acme Inc."
                              />
                           </div>
                           <div className="group">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Deal Value ($)</label>
                              <div className="relative">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                 <input
                                   type="number"
                                   step="0.01"
                                   {...register("deal_value")}
                                   className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-xl py-2.5 pl-8 pr-4 outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-semibold"
                                   placeholder="0.00"
                                 />
                              </div>
                           </div>
                           <div className="group">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Lead Source</label>
                              <select
                                 {...register("source")}
                                 className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-xl py-2.5 px-4 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-medium"
                              >
                                 <option value="website">Corporate Website</option>
                                 <option value="referral">Direct Referral</option>
                                 <option value="social_media">Social Media Channel</option>
                                 <option value="cold_call">Cold Outreach</option>
                                 <option value="email_campaign">Email Marketing</option>
                                 <option value="advertisement">Paid Advertising</option>
                                 <option value="other">Institutional / Other</option>
                              </select>
                           </div>
                           <div className="group">
                              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Assigned Agent</label>
                              <select
                                 {...register("assigned_to")}
                                 className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-xl py-2.5 px-4 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-medium"
                              >
                                 <option value="">Maintain in Generic Pool</option>
                                 {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                       {u.full_name} ({u.role})
                                    </option>
                                 ))}
                              </select>
                           </div>
                        </div>
                     </section>

                     {/* Section 3: Status & Priority */}
                     <section>
                         <div className="flex items-center gap-2 mb-6 text-indigo-600">
                            <Tag size={18} />
                            <h3 className="text-xs font-bold uppercase tracking-widest">Pipeline Position</h3>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="group">
                               <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Current Status</label>
                               <select
                                  {...register("status")}
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-xl py-2.5 px-4 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-bold capitalize"
                               >
                                  <option value="new">🆕 New Lead</option>
                                  <option value="contacted">📞 Contacted</option>
                                  <option value="qualified">✅ Qualified</option>
                                  <option value="proposal">📄 Proposal Sent</option>
                                  <option value="negotiation">🤝 Negotiation</option>
                                  <option value="converted">🚀 Converted</option>
                                  <option value="lost">❌ Lost / Closed</option>
                               </select>
                            </div>
                            <div className="group">
                               <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Urgency / Priority</label>
                               <select
                                  {...register("priority")}
                                  className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-xl py-2.5 px-4 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-bold uppercase"
                               >
                                  <option value="low">⚪ Low Priority</option>
                                  <option value="medium">🔵 Medium Priority</option>
                                  <option value="high">🟠 High Priority</option>
                                  <option value="urgent">🔴 Urgent / Immediate</option>
                               </select>
                            </div>
                            <div className="group md:col-span-2">
                               <label className="block text-xs font-bold text-gray-500 mb-2 uppercase group-focus-within:text-indigo-600 transition-colors">Lead Qualification Notes</label>
                               <textarea
                                 rows={4}
                                 {...register("notes")}
                                 className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-500 rounded-xl py-3 px-4 outline-none focus:ring-4 focus:ring-indigo-50 transition-all text-sm placeholder:italic"
                                 placeholder="Add specific observations, pain points, or requirements identified during the discovery phase..."
                               />
                            </div>
                         </div>
                     </section>
                  </div>

                  <div className="p-8 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div className="flex gap-4 w-full sm:w-auto">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all disabled:opacity-50 active:scale-95"
                        >
                          {loading ? (
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : <Save className="h-4 w-4 mr-2" />}
                          {isEdit ? "Update Strategy" : "Finalize Import"}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate("/leads")}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Abandon
                        </button>
                     </div>
                     
                     {isEdit && (user?.role === 'admin' || user?.role === 'manager') && (
                       <button
                         type="button"
                         onClick={handleDelete}
                         className="inline-flex items-center text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-tighter"
                       >
                         <Trash2 className="h-3 w-3 mr-1" />
                         Remove Permanently
                       </button>
                     )}
                  </div>
               </form>
            </div>
         </div>
      </div>
    </div>
  );
}
