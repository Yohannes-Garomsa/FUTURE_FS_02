import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Mail, Briefcase, DollarSign, ArrowRight, User } from 'react-feather';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const PRIORITY_THEMES = {
  urgent: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 shadow-red-100 dark:shadow-red-900/10",
  high: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-amber-100 dark:shadow-amber-900/10",
  medium: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 shadow-indigo-100 dark:shadow-indigo-900/10",
  low: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shadow-emerald-100 dark:shadow-emerald-900/10",
};

const PRIORITY_DOTS = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-indigo-500",
  low: "bg-emerald-500",
};

export default function LeadCard({ lead, index, isOverlay }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: lead });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="w-full h-32 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-slate-800 bg-indigo-50 dark:bg-slate-900/50 opacity-50" 
      />
    );
  }

  const initials = lead.lead_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`group bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100/80 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden ${isOverlay ? 'shadow-2xl' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
         <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black tracking-tighter shadow-inner ${PRIORITY_THEMES[lead.lead_priority] || 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500'}`}>
               {initials}
            </div>
            <div>
               <h3 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate max-w-[140px]">
                  {lead.lead_name}
               </h3>
               <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOTS[lead.lead_priority] || 'bg-gray-300 dark:bg-slate-700'}`} />
                  <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{lead.lead_priority}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="space-y-3 mb-4">
         {lead.lead_company && (
           <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <Briefcase size={12} className="shrink-0" />
              <span className="text-[11px] font-bold truncate">{lead.lead_company}</span>
           </div>
         )}
         <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black">
            <DollarSign size={12} className="shrink-0" />
            <span className="text-[11px] tracking-tight">{Number(lead.deal_value || 0).toLocaleString()} USD</span>
         </div>
      </div>

      <div className="pt-4 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
         <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center">
               <User size={10} className="text-indigo-600 dark:text-indigo-300" />
            </div>
         </div>
         <Link 
            to={`/leads/${lead.lead_id || lead.id}`}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-2 bg-gray-50 dark:bg-slate-800/50 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-gray-400 dark:text-slate-500 hover:text-white rounded-lg transition-all"
         >
            <ArrowRight size={14} />
         </Link>
      </div>
    </motion.div>
  );
}
