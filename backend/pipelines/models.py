"""
Pipeline and Stage models for managing the sales pipeline.
Supports multiple pipelines with ordered stages and lead-stage assignments.
"""
import uuid
from django.db import models
from django.conf import settings


class Pipeline(models.Model):
    """
    A sales pipeline containing ordered stages.
    E.g. 'Default Sales Pipeline', 'Enterprise Pipeline'
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_pipelines',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class PipelineStage(models.Model):
    """
    A stage within a pipeline, e.g. 'Prospecting', 'Qualification', 'Closing'.
    Stages are ordered by the `order` field.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline = models.ForeignKey(
        Pipeline,
        on_delete=models.CASCADE,
        related_name='stages',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=0, db_index=True)
    color = models.CharField(
        max_length=7, default='#6366F1',
        help_text='Hex color code for UI display',
    )
    is_win_stage = models.BooleanField(
        default=False,
        help_text='Mark if this stage represents a won deal',
    )
    is_lost_stage = models.BooleanField(
        default=False,
        help_text='Mark if this stage represents a lost deal',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['pipeline', 'order']
        unique_together = [('pipeline', 'name'), ('pipeline', 'order')]

    def __str__(self):
        return f"{self.pipeline.name} → {self.name}"


class PipelineLead(models.Model):
    """
    Associates a lead with a pipeline stage.
    Tracks the current position of a lead in the pipeline.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(
        'leads.Lead',
        on_delete=models.CASCADE,
        related_name='pipeline_entries',
    )
    pipeline = models.ForeignKey(
        Pipeline,
        on_delete=models.CASCADE,
        related_name='lead_entries',
    )
    stage = models.ForeignKey(
        PipelineStage,
        on_delete=models.CASCADE,
        related_name='leads_in_stage',
    )
    entered_stage_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('lead', 'pipeline')]
        ordering = ['stage__order']

    def __str__(self):
        return f"{self.lead} → {self.stage.name}"


class StageTransitionLog(models.Model):
    """Audit log for stage transitions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pipeline_lead = models.ForeignKey(
        PipelineLead,
        on_delete=models.CASCADE,
        related_name='transitions',
    )
    from_stage = models.ForeignKey(
        PipelineStage,
        on_delete=models.SET_NULL,
        null=True,
        related_name='+',
    )
    to_stage = models.ForeignKey(
        PipelineStage,
        on_delete=models.SET_NULL,
        null=True,
        related_name='+',
    )
    transitioned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    transitioned_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-transitioned_at']

    def __str__(self):
        return f"{self.from_stage} → {self.to_stage}"
