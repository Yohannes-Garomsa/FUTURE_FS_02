"""
Pipeline ViewSets: Pipeline CRUD, Stage management, and Lead movement (drag-and-drop).
"""
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsAdminOrManager
from .models import Pipeline, PipelineStage, PipelineLead, StageTransitionLog
from .serializers import (
    PipelineSerializer,
    PipelineCreateSerializer,
    PipelineStageSerializer,
    PipelineStageCreateSerializer,
    PipelineLeadSerializer,
    MoveLeadSerializer,
    StageTransitionLogSerializer,
    StageReorderSerializer,
)

logger = logging.getLogger('crm')


class PipelineViewSet(viewsets.ModelViewSet):
    """
    Pipeline CRUD. Admin/Manager can create/update/delete.
    All authenticated users can view.
    """
    serializer_class = PipelineSerializer
    queryset = Pipeline.objects.prefetch_related('stages')

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return PipelineCreateSerializer
        return PipelineSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'], url_path='board')
    def board(self, request, pk=None):
        """
        Get pipeline board data: stages with their leads.
        Optimized for the Kanban board view.
        """
        pipeline = self.get_object()
        stages = pipeline.stages.prefetch_related(
            'leads_in_stage__lead',
            'leads_in_stage__lead__assigned_to',
        ).order_by('order')

        board_data = []
        for stage in stages:
            pipeline_leads = stage.leads_in_stage.select_related('lead', 'lead__assigned_to')
            board_data.append({
                'stage': PipelineStageSerializer(stage).data,
                'leads': PipelineLeadSerializer(pipeline_leads, many=True).data,
            })

        return Response({
            'pipeline': {'id': str(pipeline.id), 'name': pipeline.name},
            'board': board_data,
        })


class PipelineStageViewSet(viewsets.ModelViewSet):
    """Stage CRUD within a pipeline."""
    serializer_class = PipelineStageSerializer
    queryset = PipelineStage.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'reorder']:
            return [IsAdminOrManager()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PipelineStageCreateSerializer
        if self.action == 'reorder':
            return StageReorderSerializer
        return PipelineStageSerializer

    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request):
        """
        Reorder stages (drag-and-drop on the board).
        Expects: { "stage_ids": ["uuid1", "uuid2", ...] }
        """
        serializer = StageReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stage_ids = serializer.validated_data['stage_ids']
        for order, stage_id in enumerate(stage_ids):
            PipelineStage.objects.filter(pk=stage_id).update(order=order)

        return Response({'message': 'Stages reordered successfully.'})


class PipelineLeadViewSet(viewsets.ModelViewSet):
    """
    Manage leads within pipeline stages.
    Supports adding leads to pipelines and moving them between stages.
    """
    serializer_class = PipelineLeadSerializer
    queryset = PipelineLead.objects.select_related(
        'lead', 'stage', 'pipeline',
    )

    def get_permissions(self):
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'], url_path='move')
    def move(self, request, pk=None):
        """
        Move a lead to a different stage (drag-and-drop).
        Validates the transition and creates an audit log entry.
        """
        pipeline_lead = self.get_object()
        serializer = MoveLeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_stage_id = serializer.validated_data['stage_id']
        notes = serializer.validated_data.get('notes', '')

        try:
            new_stage = PipelineStage.objects.get(
                pk=new_stage_id,
                pipeline=pipeline_lead.pipeline,
            )
        except PipelineStage.DoesNotExist:
            return Response(
                {'error': 'Target stage not found in this pipeline.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_stage = pipeline_lead.stage

        if old_stage == new_stage:
            return Response(
                {'error': 'Lead is already in this stage.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create transition log
        StageTransitionLog.objects.create(
            pipeline_lead=pipeline_lead,
            from_stage=old_stage,
            to_stage=new_stage,
            transitioned_by=request.user,
            notes=notes,
        )

        # Update the stage
        pipeline_lead.stage = new_stage
        pipeline_lead.save(update_fields=['stage', 'entered_stage_at'])

        # Update lead status if moving to win/lost stage
        if new_stage.is_win_stage:
            pipeline_lead.lead.status = 'converted'
            pipeline_lead.lead.save(update_fields=['status', 'updated_at'])
        elif new_stage.is_lost_stage:
            pipeline_lead.lead.status = 'lost'
            pipeline_lead.lead.save(update_fields=['status', 'updated_at'])

        logger.info(
            'Lead %s moved from %s to %s by %s',
            pipeline_lead.lead_id, old_stage.name,
            new_stage.name, request.user.email,
        )

        return Response(
            PipelineLeadSerializer(pipeline_lead).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        """Get transition history for a pipeline lead."""
        pipeline_lead = self.get_object()
        transitions = pipeline_lead.transitions.select_related(
            'from_stage', 'to_stage', 'transitioned_by',
        )
        serializer = StageTransitionLogSerializer(transitions, many=True)
        return Response(serializer.data)
