import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import LeadCard from './LeadCard';
import { motion } from 'framer-motion';
import { MoreVertical, MoreHorizontal } from 'react-feather';

const STAGE_COLORS = [
  "border-t-indigo-500",
  "border-t-blue-500",
  "border-t-amber-500",
  "border-t-rose-500",
  "border-t-emerald-500",
  "border-t-purple-500",
];

export default function Column({ id, title, leads, index }) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex flex-col w-80 min-w-80 group/column h-full`}
    >
      <div
        ref={setNodeRef}
        className={`bg-gray-50/50 dark:bg-slate-900/50 backdrop-blur-sm flex flex-col h-full rounded-2xl shadow-sm border border-gray-200/60 dark:border-slate-800/60 overflow-hidden transition-all duration-300 border-t-4 ${STAGE_COLORS[index % STAGE_COLORS.length]} ${isOver ? 'ring-2 ring-indigo-500/20 dark:ring-indigo-900/20 bg-indigo-50/10 dark:bg-indigo-900/10 scale-[1.01]' : ''}`}
      >
        <div className="p-5 flex justify-between items-center group/header">
          <div className="space-y-1">
             <h2 className="text-[11px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors group-hover/header:text-indigo-600 dark:group-hover/header:text-indigo-400">
               {title}
             </h2>
             <div className="flex items-center gap-2">
                <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                   {leads.length}
                </span>
                <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tighter">Opportunities</p>
             </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all opacity-0 group-hover/column:opacity-100">
             <MoreHorizontal size={14} />
          </button>
        </div>

        <div className="flex-1 px-4 pb-6 overflow-y-auto space-y-4 custom-scrollbar">
          <SortableContext
            id={id}
            items={leads.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {leads.map((lead, idx) => (
              <LeadCard key={lead.id} lead={lead} index={idx} />
            ))}
          </SortableContext>
          
          {leads.length === 0 && !isOver && (
             <div className="py-12 flex flex-col items-center justify-center opacity-40 grayscale dark:opacity-20">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-slate-700 mb-3" />
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest text-center px-8">Stage Empty</p>
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
