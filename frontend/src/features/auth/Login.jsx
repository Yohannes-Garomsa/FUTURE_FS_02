import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/store";
import { authAPI } from "../../services/api";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, ArrowRight } from "react-feather";
import toast from "react-hot-toast";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { access, refresh } = response.data;
      
      // Temporarily set token to access the /me API
      useAuthStore.getState().setToken(access);
      
      const { usersAPI } = await import("../../services/api");
      const meResponse = await usersAPI.getMe();
      
      login(meResponse.data, access, refresh);
      toast.success(`Welcome back, ${meResponse.data.full_name || 'Executive'}`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication sequence failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-500">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 dark:bg-indigo-950 relative overflow-hidden flex-col justify-between p-16">
         <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-white blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400 blur-[100px]" />
         </div>

         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                  <Zap size={24} className="text-indigo-600 fill-current" />
               </div>
               <h1 className="text-2xl font-black text-white tracking-tighter">FUTURE <span className="text-indigo-200">CRM</span></h1>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="max-w-md space-y-6"
            >
               <h2 className="text-5xl font-black text-white leading-tight tracking-tight">Intelligence for the Next Generation of Sales.</h2>
               <p className="text-indigo-100 text-lg font-medium opacity-80 leading-relaxed">
                  Join 10,000+ high-performance teams using Future CRM to orchestrate their global sales operations.
               </p>
            </motion.div>
         </div>

         <div className="relative z-10 flex items-center gap-6">
            <div className="flex -space-x-4">
               {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-indigo-600 bg-indigo-200 overflow-hidden shadow-xl" />
               ))}
            </div>
            <p className="text-indigo-100 text-sm font-bold opacity-70">Over 500 new agents joined this week.</p>
         </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-12"
         >
            <header className="space-y-3">
               <div className="lg:hidden flex items-center gap-2 mb-6">
                  <Zap size={32} className="text-indigo-600 fill-current" />
                  <span className="text-xl font-black tracking-tighter">FUTURE <span className="text-indigo-600">CRM</span></span>
               </div>
               <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Strategic Entry</h2>
               <p className="text-gray-500 font-medium">Access your enterprise dashboard</p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
               <div className="space-y-5">
                  <div className="group space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">Access Identifier</label>
                     <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          placeholder="executive@company.ai"
                          required
                          className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-gray-900 dark:text-white transition-all focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20"
                          value={formData.email}
                          onChange={handleChange}
                        />
                     </div>
                  </div>

                  <div className="group space-y-2">
                     <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">Security Protocol</label>
                        <button type="button" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Lost Key?</button>
                     </div>
                     <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="password"
                          name="password"
                          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                          required
                          className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-gray-900 dark:text-white transition-all focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/20"
                          value={formData.password}
                          onChange={handleChange}
                        />
                     </div>
                  </div>
               </div>

               <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
               >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Execute Entry <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
               </button>
            </form>

            <footer className="pt-4 text-center">
               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  Unauthorized access ? {" "}
                  <button
                    onClick={() => navigate("/register")}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Register Identity
                  </button>
               </p>
            </footer>
         </motion.div>
      </div>
    </div>
  );
}
