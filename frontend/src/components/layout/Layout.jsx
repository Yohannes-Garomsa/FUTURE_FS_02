import { useState, useEffect } from "react";
import { useAuthStore, useThemeStore } from "../../store/store";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Home, Users, Layout as LayoutIcon, Settings, LogOut, Menu, X, Bell, User as UserIcon,
  Search, Briefcase, Zap, Inbox, MoreVertical, ChevronRight, Activity, Globe,
  Sun, Moon
} from "react-feather";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function Layout({ children }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    logout();
    toast.success("Disconnected. Safe travel!");
    navigate("/login");
  };

  const menuItems = [
    { title: "Strategic Overview", icon: Home, path: "/dashboard", roles: ["admin", "manager", "agent"] },
    { title: "Lead Intelligence", icon: Users, path: "/leads", roles: ["admin", "manager", "agent"] },
    { title: "Sales Pipeline", icon: LayoutIcon, path: "/pipeline", roles: ["admin", "manager", "agent"] },
    { title: "Workforce", icon: Settings, path: "/users", roles: ["admin"] },
  ];

  const activeItem = menuItems.find(item => location.pathname.startsWith(item.path)) || menuItems[0];
  const userInitials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  const NavItem = ({ item, isMobile = false }) => {
    const isActive = location.pathname.startsWith(item.path);
    if (!item.roles.includes(user?.role)) return null;

    return (
      <Link
        to={item.path}
        onClick={() => isMobile && setIsSidebarOpen(false)}
        className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-indigo-600'
        }`}
      >
        <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'} />
        <span className={`text-sm font-black tracking-tight ${isMobile ? 'text-lg' : ''}`}>{item.title}</span>
        {isActive && !isMobile && (
          <motion.div 
             layoutId="nav-indicator"
             className="ml-auto"
          >
             <ChevronRight size={14} />
          </motion.div>
        )}
      </Link>
    );
  };

  if (!isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#FDFDFF] dark:bg-slate-950 flex transition-colors duration-500">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 pb-8 overflow-y-auto z-50">
        <div className="p-8 pb-12">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20">
                 <Zap size={22} className="text-white fill-current" />
              </div>
              <div>
                 <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">FUTURE <span className="text-indigo-600">CRM</span></h1>
                 <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Enterprise Suite</p>
              </div>
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
           <p className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Operations Hub</p>
           {menuItems.map(item => (
              <NavItem key={item.path} item={item} />
           ))}
        </nav>

        <div className="px-6 mt-8">
           <div className="bg-indigo-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-indigo-100 dark:border-slate-800 relative overflow-hidden group">
              <Globe size={40} className="absolute -bottom-2 -right-4 text-indigo-200 opacity-20 transform group-hover:scale-110 transition-transform" />
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-1">HQ Access</h4>
              <p className="text-[11px] font-bold text-indigo-600/70 mb-4 tracking-tight">System fully operational. Current latency: 24ms.</p>
              <button 
                 onClick={handleLogout}
                 className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase hover:text-indigo-800 transition-colors"
              >
                 <LogOut size={14} /> Close Session
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
           >
             <Menu size={24} />
           </button>
           
           <div className="hidden md:flex items-center gap-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl px-4 py-2 w-96 transform transition-all focus-within:ring-4 focus-within:ring-indigo-50 dark:focus-within:ring-indigo-900/20 leading-none">
              <Search size={18} className="text-gray-400" />
              <input 
                type="text" 
                placeholder="Search global intelligence..." 
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-600 dark:text-gray-300 w-full placeholder:text-gray-400"
              />
           </div>

           <div className="flex items-center gap-6">
              <button 
                onClick={toggleTheme}
                className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all hover:shadow-lg active:scale-95 group"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <Sun size={18} className="group-hover:rotate-12 transition-transform" />
                ) : (
                  <Moon size={18} className="group-hover:-rotate-12 transition-transform" />
                )}
              </button>

              <button className="relative p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all group">
                 <Bell size={20} />
                 <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
              
              <div className="flex items-center gap-4 pl-6 border-l border-gray-100 dark:border-slate-800">
                 <div className="text-right hidden sm:block leading-tight">
                    <p className="text-[11px] font-black text-gray-900 dark:text-white tracking-tight">{user?.full_name}</p>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none mt-1 opacity-70 mb-0.5">{user?.role}</p>
                 </div>
                 <div className="relative">
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-black shadow-inner active:scale-95 transition-all overflow-hidden"
                    >
                       {userInitials}
                    </button>
                    
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-4 w-56 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 py-4 z-50 overflow-hidden ring-4 ring-black/5"
                        >
                           <div className="px-6 pb-4 border-b border-gray-50 dark:border-slate-800 mb-4">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Authenticated As</p>
                              <p className="text-sm font-black text-gray-900 dark:text-white truncate">{user?.email}</p>
                           </div>
                           <div className="px-2 space-y-1">
                              <button 
                                onClick={() => { navigate("/profile"); setIsUserMenuOpen(false); }}
                                className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                              >
                                 <UserIcon size={16} /> Identity Profile
                              </button>
                              <button 
                                onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                                className="w-full flex items-center gap-4 px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                              >
                                 <LogOut size={16} /> Disconnect
                              </button>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[85%] max-w-sm bg-white dark:bg-slate-900 z-[70] lg:hidden flex flex-col p-8 border-r border-gray-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center">
                       <Zap size={22} className="text-white fill-current" />
                    </div>
                    <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">Global <span className="text-indigo-600">HQ</span></h1>
                 </div>
                 <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 space-y-4">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 pl-4">Navigation Index</p>
                 {menuItems.map(item => (
                    <NavItem key={item.path} item={item} isMobile />
                 ))}
              </div>

              <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-black">
                       {userInitials}
                    </div>
                    <div className="leading-tight">
                       <p className="text-xs font-black text-gray-900 tracking-tight">{user?.full_name}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.role}</p>
                    </div>
                 </div>
                 <button 
                   onClick={handleLogout}
                   className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                 >
                   <LogOut size={20} />
                 </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
