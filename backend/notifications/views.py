"""
Notification ViewSet — users can only see their own notifications.
Provides mark-as-read and mark-all-read actions.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.pagination import SmallPagination
from .models import Notification
from .serializers import NotificationSerializer, NotificationListSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only notifications for the authenticated user.
    Supports mark-as-read and mark-all-read.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = SmallPagination

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return NotificationListSerializer
        return NotificationSerializer

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'message': 'Notification marked as read.'})

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        """Mark all notifications as read for the current user."""
        count = Notification.objects.filter(
            recipient=request.user, is_read=False,
        ).update(is_read=True)
        return Response({'message': f'{count} notifications marked as read.'})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Get the count of unread notifications."""
        count = Notification.objects.filter(
            recipient=request.user, is_read=False,
        ).count()
        return Response({'unread_count': count})
