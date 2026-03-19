"""Notification model for in-app notifications."""
import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    """In-app notification for users."""

    class NotificationType(models.TextChoices):
        LEAD_ASSIGNED = 'lead_assigned', 'Lead Assigned'
        LEAD_STATUS_CHANGED = 'lead_status_changed', 'Lead Status Changed'
        ACTIVITY_CREATED = 'activity_created', 'Activity Created'
        PIPELINE_MOVED = 'pipeline_moved', 'Pipeline Stage Changed'
        SYSTEM = 'system', 'System Notification'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        db_index=True,
    )
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        db_index=True,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)

    # Optional reference to the related object
    related_lead_id = models.UUIDField(null=True, blank=True)
    related_activity_id = models.UUIDField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.recipient}"
