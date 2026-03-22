import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/store";
import { authAPI } from "../../services/api";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, ArrowRight } from "react-feather";
import toast from "react-hot-toast";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "", // CRM backend uses full_name
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      login(response.data.user, response.data.access);
      toast.success("Identity registered. Welcome to the enterprise.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration protocol failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex bg-white relative overflow-hidden">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden flex-col justify-between p-16">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-white blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400 blur-[100px]" />
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
               <h2 className="text-5xl font-black text-white leading-tight tracking-tight">Scale Your Operations at Warp Speed.</h2>
               <p className="text-indigo-100 text-lg font-medium opacity-80 leading-relaxed">
                  The infrastructure you need to turn raw leads into loyal customers. Automated, intelligent, and built for growth.
               </p>
            </motion.div>
         </div>

         <div className="relative z-10">
            <div className="bg-indigo-700/30 backdrop-blur-md border border-indigo-500/30 p-8 rounded-[40px] max-w-sm">
               <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Zap key={i} size={14} className="text-indigo-300 fill-current" />
                  ))}
               </div>
               <p className="text-white font-bold italic">"Future CRM has doubled our sales velocity in less than 3 months. Truly transformative tool for our agency."</p>
               <p className="mt-4 text-xs font-black text-indigo-200 uppercase tracking-widest">— Global Sales Director, Apex Corp</p>
            </div>
         </div>
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-10"
         >
            <header className="space-y-3">
               <div className="lg:hidden flex items-center gap-2 mb-6">
                  <Zap size={32} className="text-indigo-600 fill-current" />
                  <span className="text-xl font-black tracking-tighter">FUTURE <span className="text-indigo-600">CRM</span></span>
               </div>
               <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Identity Registration</h2>
               <p className="text-gray-500 font-medium">Join the next generation of sales professionals</p>
            </header>

            <form className="space-y-6" onSubmit={handleSubmit}>
               <div className="space-y-5">
                  <div className="group space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">Full Name</label>
                     <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="full_name"
                          placeholder="John Executive"
                          required
                          className="w-full bg-gray-50 border border-gray-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-gray-900 transition-all focus:ring-4 focus:ring-indigo-50"
                          value={formData.full_name}
                          onChange={handleChange}
                        />
                     </div>
                  </div>

                  <div className="group space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">Digital Contact</label>
                     <div className="relative">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          placeholder="executive@company.ai"
                          required
                          className="w-full bg-gray-50 border border-gray-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-gray-900 transition-all focus:ring-4 focus:ring-indigo-50"
                          value={formData.email}
                          onChange={handleChange}
                        />
                     </div>
                  </div>

                  <div className="group space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">Security Key</label>
                     <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="password"
                          name="password"
                          placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                          required
                          className="w-full bg-gray-50 border border-gray-100 focus:border-indigo-500 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 outline-none font-bold text-gray-900 transition-all focus:ring-4 focus:ring-indigo-50"
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
                      Register Identity <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
               </button>
            </form>

            <footer className="pt-4 text-center">
               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  Already registered? {" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Authorize Session
                  </button>
               </p>
            </footer>
         </motion.div>
      </div>
    </div>
  );
}
