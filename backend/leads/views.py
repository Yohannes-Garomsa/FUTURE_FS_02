"""
Lead ViewSet with full RBAC, filtering, searching, soft delete,
and file attachment support.
"""
import logging

from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from common.permissions import IsAdminOrManager, IsLeadOwnerOrAdmin
from common.pagination import StandardPagination
from .models import Lead, LeadAttachment
from .serializers import (
    LeadSerializer,
    LeadCreateSerializer,
    LeadUpdateSerializer,
    LeadListSerializer,
    LeadAttachmentSerializer,
    LeadAttachmentUploadSerializer,
)

logger = logging.getLogger('crm')


class LeadViewSet(viewsets.ModelViewSet):
    """
    Lead management with RBAC:
    - Admin/Manager: see all leads
    - Agent: see only assigned leads
    """
    serializer_class = LeadSerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'source', 'priority', 'assigned_to']
    search_fields = ['first_name', 'last_name', 'email', 'company']
    ordering_fields = ['created_at', 'updated_at', 'deal_value', 'status', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Lead.objects.none()
        qs = Lead.objects.select_related('assigned_to', 'created_by')

        if user.role in ('admin', 'manager'):
            return qs
        # Agents see only their assigned leads
        return qs.filter(assigned_to=user)

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated()]
        if self.action in ['destroy', 'hard_delete', 'restore']:
            return [IsAdminOrManager()]
        if self.action in ['retrieve', 'update', 'partial_update']:
            return [IsLeadOwnerOrAdmin()]
        if self.action == 'assign':
            return [IsAdminOrManager()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return LeadCreateSerializer
        if self.action in ['update', 'partial_update']:
            return LeadUpdateSerializer
        if self.action == 'list':
            return LeadListSerializer
        if self.action == 'upload_attachment':
            return LeadAttachmentUploadSerializer
        return LeadSerializer

    def perform_create(self, serializer):
        lead = serializer.save(created_by=self.request.user)
        logger.info('Lead created: %s by %s', lead.full_name, self.request.user.email)
        # Trigger notification if assigned
        if lead.assigned_to:
            from notifications.tasks import notify_lead_assigned
            notify_lead_assigned.delay(str(lead.id), str(lead.assigned_to.id))

    def perform_update(self, serializer):
        old_status = self.get_object().status
        old_assigned = self.get_object().assigned_to_id
        lead = serializer.save()
        # Check for status change notification
        if lead.status != old_status:
            from notifications.tasks import notify_lead_status_changed
            notify_lead_status_changed.delay(str(lead.id), old_status, lead.status)
        # Check for assignment change notification
        if lead.assigned_to_id and lead.assigned_to_id != old_assigned:
            from notifications.tasks import notify_lead_assigned
            notify_lead_assigned.delay(str(lead.id), str(lead.assigned_to_id))

    def perform_destroy(self, instance):
        """Override destroy to perform soft delete."""
        instance.soft_delete()
        logger.info('Lead soft-deleted: %s by %s', instance.full_name, self.request.user.email)

    @action(detail=True, methods=['patch'], url_path='assign')
    def assign(self, request, pk=None):
        """Assign a lead to a user (admin/manager only)."""
        lead = self.get_object()
        user_id = request.data.get('assigned_to')
        if not user_id:
            return Response(
                {'error': 'assigned_to is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from users.models import User
        try:
            agent = User.objects.get(pk=user_id, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found or inactive'},
                status=status.HTTP_404_NOT_FOUND,
            )
        lead.assigned_to = agent
        lead.save(update_fields=['assigned_to', 'updated_at'])

        # Trigger notification
        from notifications.tasks import notify_lead_assigned
        notify_lead_assigned.delay(str(lead.id), str(agent.id))

        logger.info('Lead %s assigned to %s', lead.full_name, agent.email)
        return Response(
            {'message': f'Lead assigned to {agent.full_name}.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        """Restore a soft-deleted lead."""
        try:
            lead = Lead.all_objects.get(pk=pk, is_deleted=True)
        except Lead.DoesNotExist:
            return Response(
                {'error': 'Deleted lead not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        lead.restore()
        logger.info('Lead restored: %s', lead.full_name)
        return Response(LeadSerializer(lead).data, status=status.HTTP_200_OK)

    @action(
        detail=True, methods=['post', 'get'],
        url_path='attachments',
        parser_classes=[MultiPartParser, FormParser],
    )
    def attachments(self, request, pk=None):
        """Upload or list attachments for a lead."""
        lead = self.get_object()

        if request.method == 'GET':
            attachments = lead.attachments.select_related('uploaded_by')
            serializer = LeadAttachmentSerializer(attachments, many=True)
            return Response(serializer.data)

        # POST — upload file
        serializer = LeadAttachmentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.validated_data['file']
        attachment = LeadAttachment.objects.create(
            lead=lead,
            file=file_obj,
            original_filename=file_obj.name,
            file_size=file_obj.size,
            uploaded_by=request.user,
        )
        logger.info('Attachment uploaded to lead %s: %s', lead.full_name, file_obj.name)
        return Response(
            LeadAttachmentSerializer(attachment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get'], url_path='deleted')
    def deleted(self, request):
        """List soft-deleted leads (admin/manager only)."""
        if request.user.role not in ('admin', 'manager'):
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN,
            )
        leads = Lead.all_objects.filter(is_deleted=True).select_related(
            'assigned_to', 'created_by'
        )
        page = self.paginate_queryset(leads)
        if page is not None:
            serializer = LeadListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = LeadListSerializer(leads, many=True)
        return Response(serializer.data)