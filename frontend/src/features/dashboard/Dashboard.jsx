import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../../store/store";
import { analyticsAPI, leadsAPI } from "../../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  CalendarIcon, UsersIcon, PhoneIcon, EnvelopeIcon,
  TrendingUpIcon, DollarSign, Target, Award, Hash, Zap, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const STATUS_COLORS = {
  New: "#3b82f6",
  Contacted: "#f59e0b",
  Qualified: "#10b981",
  Proposal: "#6366f1",
  Negotiation: "#8b5cf6",
  Converted: "#10b981",
  Lost: "#ef4444",
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeDeads: 0,
    conversionRate: 0,
    revenue: 0,
    leadsByStatus: [],
    leadsBySource: [],
    leadsByPriority: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (user?.role === "admin" || user?.role === "manager") {
         const response = await analyticsAPI.getDashboardStats();
         const { overview, leads_by_status, leads_by_source, leads_by_priority } = response.data;
         
         setStats({
           totalLeads: overview.total_leads,
           activeDeals: overview.active_deals,
           conversionRate: overview.conversion_rate,
           revenue: overview.total_revenue,
           leadsByStatus: leads_by_status.map(s => ({ name: s.status.charAt(0).toUpperCase() + s.status.slice(1), value: s.count })),
           leadsBySource: leads_by_source.map(s => ({ name: s.source?.replace('_', ' ') || 'Unknown', value: s.count })),
           leadsByPriority: leads_by_priority.map(s => ({ name: s.priority, value: s.count })),
         });
      } else {
         const response = await leadsAPI.getLeads();
         const leads = response.data.results || [];
         
         const groupedStatus = leads.reduce((acc, l) => {
            acc[l.status] = (acc[l.status] || 0) + 1;
            return acc;
         }, {});

         const groupedSource = leads.reduce((acc, l) => {
            const src = l.source || 'Other';
            acc[src] = (acc[src] || 0) + 1;
            return acc;
         }, {});

         const groupedPriority = leads.reduce((acc, l) => {
            acc[l.priority] = (acc[l.priority] || 0) + 1;
            return acc;
         }, {});

         const convertedCount = leads.filter(l => l.status === 'converted').length;

         setStats({
           totalLeads: leads.length,
           activeDeals: leads.filter(l => !['converted', 'lost'].includes(l.status)).length,
           conversionRate: leads.length > 0 ? (convertedCount / leads.length) * 100 : 0,
           revenue: leads.filter(l => l.status === 'converted').reduce((sum, l) => sum + Number(l.deal_value || 0), 0),
           leadsByStatus: Object.keys(groupedStatus).map(k => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: groupedStatus[k] })),
           leadsBySource: Object.keys(groupedSource).map(k => ({ name: k.replace('_', ' '), value: groupedSource[k] })),
           leadsByPriority: Object.keys(groupedPriority).map(k => ({ name: k, value: groupedPriority[k] })),
         });
      }
      setLastUpdated(new Date());
    } catch (error) {
      toast.error("Analytics sync failed.");
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: "Total Funnel", value: stats.totalLeads, icon: Hash, color: "indigo", unit: "Leads" },
    { title: "Projected Revenue", value: stats.revenue.toLocaleString(), icon: DollarSign, color: "emerald", unit: "USD", prefix: "$" },
    { title: "Pipeline Velocity", value: stats.activeDeals, icon: Zap, color: "amber", unit: "Active" },
    { title: "Success Rate", value: parseFloat(stats.conversionRate).toFixed(1), icon: Target, color: "rose", unit: "%", suffix: "%" },
  ];

  if (loading) return (
     <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-[0.2em]">Synchronizing Intelligence...</p>
        </div>
     </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-gray-50/30">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">Executive Dashboard</h1>
             <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase rounded-md border border-indigo-200">{user?.role} Access</span>
          </div>
          <p className="text-gray-500 font-medium">Reporting intelligence for <span className="text-indigo-600 font-bold">{user?.full_name}</span> &bull; Strategy Room</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Intelligence Update</p>
              <p className="text-xs font-black text-gray-600">{lastUpdated.toLocaleTimeString()}</p>
           </div>
           <button 
             onClick={fetchDashboardData}
             className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-indigo-600 hover:border-indigo-100 transition-all hover:shadow-lg active:scale-95"
           >
             <RefreshCw size={20} />
           </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
           <motion.div
             key={card.title}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: idx * 0.1 }}
             className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all relative overflow-hidden"
           >
             <div className={`absolute top-0 right-0 p-8 opacity-[0.03] text-${card.color}-600 group-hover:scale-125 transition-transform`}>
                <card.icon size={80} strokeWidth={3} />
             </div>
             <div className="relative z-10 space-y-3">
                <div className={`w-10 h-10 rounded-xl bg-${card.color}-50 flex items-center justify-center text-${card.color}-600`}>
                   <card.icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{card.title}</p>
                  <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-black text-gray-900">{card.prefix}{card.value}{card.suffix}</span>
                     <span className="text-[10px] font-bold text-gray-400 uppercase">{card.unit}</span>
                  </div>
                </div>
             </div>
           </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
            >
               <div className="flex items-center justify-between mb-8">
                 <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase border-l-4 border-indigo-500 pl-4">Pipeline Distribution</h2>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Volume by stage</p>
               </div>
               <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.leadsByStatus} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#9ca3af' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontSize: '12px' }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[8, 8, 0, 0]} 
                        barSize={40}
                      >
                         {stats.leadsByStatus.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
            >
               <div className="flex items-center justify-between mb-8">
                 <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase border-l-4 border-amber-500 pl-4">Priority Breakdown</h2>
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Velocity metrics</p>
               </div>
               <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={stats.leadsByPriority} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                      <XAxis type="number" axisLine={false} tickLine={false} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'black', fill: '#4b5563', textTransform: 'uppercase' }} />
                      <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px' }} />
                      <Bar dataKey="value" fill="#fbbf24" radius={[0, 8, 8, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </motion.div>
         </div>

         <div className="space-y-8">
            <motion.div 
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
            >
               <div className="flex items-center justify-between mb-8">
                 <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase border-l-4 border-indigo-500 pl-4">Lead Sources</h2>
               </div>
               <div className="h-[300px] flex flex-col items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.leadsBySource}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={10}
                        dataKey="value"
                        stroke="none"
                      >
                        {stats.leadsBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
            </motion.div>

            <div className="bg-indigo-600 p-8 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
               <div className="relative z-10">
                  <Award size={32} className="mb-4 text-indigo-200" />
                  <h3 className="text-xl font-bold mb-2 tracking-tight">System Performance</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed mb-6 italic opacity-80 underline underline-offset-8 decoration-indigo-400">
                    "Your conversion velocity is trending <span className="font-black text-white">12% higher</span> than last quarter benchmarks."
                  </p>
                  <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-3 rounded-xl transition-all border border-white/20 text-xs tracking-widest uppercase">
                    Download Full Audit
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
