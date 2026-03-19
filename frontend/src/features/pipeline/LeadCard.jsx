import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChatBubbleLeftRightIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function LeadCard({ lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id, data: lead });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded bg-white shadow-sm ring-1 ring-gray-900/5 hover:bg-gray-50 hover:shadow-md cursor-grab active:cursor-grabbing transition-all border-l-4 border-indigo-500"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-900 truncate" title={lead.name}>
          {lead.name}
        </h3>
      </div>
      
      {lead.company && (
        <p className="text-xs text-gray-500 mb-3 truncate">{lead.company}</p>
      )}

      <div className="flex items-center gap-3 text-gray-400">
        {lead.email && (
          <div className="flex items-center text-xs" title={lead.email}>
            <EnvelopeIcon className="h-3.5 w-3.5 mr-1" />
            <span className="truncate max-w-[120px]">{lead.email}</span>
          </div>
        )}
      </div>
    </div>
  );
}
