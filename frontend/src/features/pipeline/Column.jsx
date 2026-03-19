import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import LeadCard from './LeadCard';

export default function Column({ id, title, leads }) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  const style = {
    backgroundColor: isOver ? '#f3f4f6' : '#f9fafb',
    transition: 'background-color 0.2s ease',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-gray-50 flex flex-col w-80 rounded-lg shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className="bg-gray-100 p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h2>
        <span className="bg-white text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full shadow-sm">
          {leads.length}
        </span>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px]">
        <SortableContext
          id={id}
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
