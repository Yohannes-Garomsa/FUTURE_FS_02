import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { leadsAPI } from '../../services/api';
import Column from './Column';

const COLUMNS = [
  { id: 'new', title: 'New' },
  { id: 'contacted', title: 'Contacted' },
  { id: 'qualified', title: 'Qualified' },
  { id: 'converted', title: 'Converted' },
  { id: 'lost', title: 'Lost' },
];

export default function Pipeline() {
  const queryClient = useQueryClient();

  const { data: fetchResponse = { data: [] }, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => await leadsAPI.getLeads(),
  });

  const leads = fetchResponse.data || [];

  const updateLeadStatus = useMutation({
    mutationFn: ({ id, status }) => leadsAPI.updateLead(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      const previousLeads = queryClient.getQueryData(['leads']);

      if (previousLeads?.data) {
        queryClient.setQueryData(['leads'], {
          ...previousLeads,
          data: previousLeads.data.map((lead) =>
            lead.id === id ? { ...lead, status } : lead
          ),
        });
      }
      return { previousLeads };
    },
    onError: (err, variables, context) => {
      if (context?.previousLeads) {
        queryClient.setQueryData(['leads'], context.previousLeads);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id;
    const newStatus = over.id; // column id

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    updateLeadStatus.mutate({ id: leadId, status: newStatus });
  };

  const leadsByStatus = useMemo(() => {
    const grouped = {
      new: [],
      contacted: [],
      qualified: [],
      converted: [],
      lost: [],
    };
    leads.forEach((lead) => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      } else {
        // Fallback for unexpected status
        grouped.new.push(lead);
      }
    });
    return grouped;
  }, [leads]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Pipeline...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 h-full bg-gray-50 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <p className="mt-1 text-sm text-gray-500">Drag and drop leads to update their status.</p>
      </div>

      <div className="flex-1 overflow-x-auto">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 pb-4 h-full min-h-[600px] w-max">
            {COLUMNS.map((column) => (
              <Column key={column.id} id={column.id} title={column.title} leads={leadsByStatus[column.id]} />
            ))}
          </div>
        </DndContext>
      </div>
    </div>
  );
}
