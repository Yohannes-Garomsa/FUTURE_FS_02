import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { pipelineAPI } from '../../services/api';
import Column from './Column';
import LeadCard from './LeadCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout, Filter, Search, Plus, Info } from 'react-feather';
import toast from 'react-hot-toast';

export default function Pipeline() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(null);

  const { data: pipelinesResponse, isLoading: loadingPipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => pipelineAPI.getPipelines(),
  });

  const pipelines = pipelinesResponse?.data?.results || [];
  const activePipelineId = pipelines[0]?.id;

  const { data: boardResponse, isLoading: loadingBoard } = useQuery({
    queryKey: ['pipeline-board', activePipelineId],
    queryFn: () => pipelineAPI.getPipelineBoard(activePipelineId),
    enabled: !!activePipelineId,
  });

  const boardData = boardResponse?.data?.board || [];
  const pipelineInfo = boardResponse?.data?.pipeline;

  const moveLeadMutation = useMutation({
    mutationFn: ({ pipelineLeadId, stageId }) => 
      pipelineAPI.moveLead(pipelineLeadId, { stage_id: stageId }),
    onMutate: async ({ pipelineLeadId, stageId }) => {
      await queryClient.cancelQueries({ queryKey: ['pipeline-board', activePipelineId] });
      const previousBoard = queryClient.getQueryData(['pipeline-board', activePipelineId]);

      if (previousBoard?.data?.board) {
        const newBoard = previousBoard.data.board.map(col => {
          const filteredLeads = col.leads.filter(l => l.id !== pipelineLeadId);
          if (col.stage.id === stageId) {
            const movedLead = previousBoard.data.board
              .flatMap(c => c.leads)
              .find(l => l.id === pipelineLeadId);
            
            if (movedLead) {
               return { ...col, leads: [...filteredLeads, { ...movedLead, stage: stageId }] };
            }
          }
          return { ...col, leads: filteredLeads };
        });

        queryClient.setQueryData(['pipeline-board', activePipelineId], {
          ...previousBoard,
          data: { ...previousBoard.data, board: newBoard }
        });
      }
      return { previousBoard };
    },
    onError: (err, variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(['pipeline-board', activePipelineId], context.previousBoard);
      }
      toast.error("Failed to relocate lead.");
    },
    onSuccess: () => {
      toast.success("Lead relocated successfully.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-board', activePipelineId] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const pipelineLeadId = active.id;
    const newStageId = over.id;

    const currentStage = boardData.find(col => col.leads.some(l => l.id === pipelineLeadId))?.stage;
    if (currentStage?.id === newStageId) return;

    moveLeadMutation.mutate({ pipelineLeadId, stageId: newStageId });
  };

  const activeLead = activeId 
    ? boardData.flatMap(c => c.leads).find(l => l.id === activeId) 
    : null;

  if (loadingPipelines || loadingBoard) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4 font-black"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Initializing Board Architecture...</p>
        </div>
      </div>
    );
  }

  if (!activePipelineId) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-center bg-gray-50/10">
        <div className="max-w-md space-y-4">
           <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 inline-block mb-4">
              <Layout size={40} className="text-gray-300" />
           </div>
           <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Pipelines Architected</h3>
           <p className="text-gray-500 text-sm leading-relaxed">No active sales pipelines were identified. Consult your administrator to initialize a new funnel strategy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 h-full bg-gray-50 dark:bg-slate-950 flex flex-col overflow-hidden transition-colors duration-500">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase leading-none">
                {pipelineInfo?.name?.split(' ')[0]} <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{pipelineInfo?.name?.split(' ').slice(1).join(' ')}</span>
             </h1>
          </div>
          <p className="text-gray-500 dark:text-slate-400 font-medium text-sm">Orchestrate and optimize deal velocity across all funnel stages.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Find Intelligence..."
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-50 dark:focus-within:ring-indigo-900/20 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all w-48 lg:w-64 dark:text-white"
              />
           </div>
           <button className="p-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all hover:shadow-lg active:scale-95">
              <Filter size={18} />
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto custom-scrollbar -mx-4 px-4 pb-8">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-h-[600px] w-max">
            {boardData.map((column, idx) => (
              <Column 
                key={column.stage.id} 
                id={column.stage.id} 
                title={column.stage.name} 
                leads={column.leads} 
                index={idx}
              />
            ))}
          </div>
          
          <DragOverlay dropAnimation={{
             sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: '0.4' } }
             })
          }}>
            {activeId && activeLead ? (
              <div className="rotate-2 scale-105 transition-transform duration-200 shadow-2xl rounded-2xl overflow-hidden ring-2 ring-indigo-500 ring-offset-4 ring-offset-gray-50">
                 <LeadCard lead={activeLead} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
