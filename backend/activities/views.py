"""
Activity ViewSet with RBAC and filtering.
Activities inherit lead-level permissions.
"""
import logging

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from common.permissions import IsLeadOwnerOrAdmin
from common.pagination import StandardPagination
from .models import Activity
from .serializers import (
    ActivitySerializer,
    ActivityCreateSerializer,
    ActivityListSerializer,
)

logger = logging.getLogger('crm')


class ActivityViewSet(viewsets.ModelViewSet):
    """
    Activity CRUD with lead-level RBAC:
    - Admin/Manager: see all activities
    - Agent: see activities on their assigned leads only
    """
    serializer_class = ActivitySerializer
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['lead', 'activity_type', 'completed']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'scheduled_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Activity.objects.none()
        qs = Activity.objects.select_related('lead', 'created_by')

        if user.role in ('admin', 'manager'):
            return qs
        # Agents see activities only for their assigned leads
        return qs.filter(lead__assigned_to=user)

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsLeadOwnerOrAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return ActivityCreateSerializer
        if self.action == 'list':
            return ActivityListSerializer
        return ActivitySerializer

    def perform_create(self, serializer):
        activity = serializer.save(created_by=self.request.user)
        logger.info(
            'Activity created: %s on lead %s by %s',
            activity.title, activity.lead_id, self.request.user.email,
        )