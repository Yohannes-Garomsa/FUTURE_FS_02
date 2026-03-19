"""Notification serializers."""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Full notification serializer."""

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'notification_type',
            'title', 'message', 'is_read',
            'related_lead_id', 'related_activity_id',
            'created_at',
        ]
        read_only_fields = [
            'id', 'recipient', 'notification_type',
            'title', 'message',
            'related_lead_id', 'related_activity_id',
            'created_at',
        ]


class NotificationListSerializer(serializers.ModelSerializer):
    """Lightweight notification serializer for list views."""

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title',
            'is_read', 'created_at',
        ]
