"""Activity model with UUID PK, scheduled_at for meetings, and proper indexes."""
import uuid
from django.db import models
from django.conf import settings


class Activity(models.Model):
    """
    Activities linked to leads: calls, emails, meetings, notes.
    Provides a timeline view of all interactions with a lead.
    """

    class ActivityType(models.TextChoices):
        CALL = 'call', 'Phone Call'
        EMAIL = 'email', 'Email'
        MEETING = 'meeting', 'Meeting'
        NOTE = 'note', 'Note'
        TASK = 'task', 'Task'
        FOLLOW_UP = 'follow_up', 'Follow Up'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(
        'leads.Lead',
        on_delete=models.CASCADE,
        related_name='activities',
        db_index=True,
    )
    activity_type = models.CharField(
        max_length=20,
        choices=ActivityType.choices,
        db_index=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    # For scheduling meetings/calls
    scheduled_at = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activities',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Activities'
        indexes = [
            models.Index(fields=['lead', 'activity_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['scheduled_at']),
        ]

    def __str__(self):
        return f"{self.get_activity_type_display()} — {self.title}"