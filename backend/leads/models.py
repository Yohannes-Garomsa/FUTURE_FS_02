"""
Lead model with UUID PK, soft delete, source tracking, deal value,
and file attachment support.
"""
import uuid
from django.db import models
from django.conf import settings
from common.utils import get_file_upload_path


class LeadManager(models.Manager):
    """Custom manager that excludes soft-deleted leads by default."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

    def all_with_deleted(self):
        return super().get_queryset()

    def deleted_only(self):
        return super().get_queryset().filter(is_deleted=True)


class Lead(models.Model):
    """Core Lead model for the CRM."""

    class Status(models.TextChoices):
        NEW = 'new', 'New'
        CONTACTED = 'contacted', 'Contacted'
        QUALIFIED = 'qualified', 'Qualified'
        PROPOSAL = 'proposal', 'Proposal Sent'
        NEGOTIATION = 'negotiation', 'Negotiation'
        CONVERTED = 'converted', 'Converted'
        LOST = 'lost', 'Lost'

    class Source(models.TextChoices):
        WEBSITE = 'website', 'Website'
        REFERRAL = 'referral', 'Referral'
        SOCIAL_MEDIA = 'social_media', 'Social Media'
        COLD_CALL = 'cold_call', 'Cold Call'
        EMAIL_CAMPAIGN = 'email_campaign', 'Email Campaign'
        ADVERTISEMENT = 'advertisement', 'Advertisement'
        OTHER = 'other', 'Other'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Contact info
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField(max_length=255, db_index=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    company = models.CharField(max_length=255, blank=True, default='')
    job_title = models.CharField(max_length=255, blank=True, default='')

    # CRM fields
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW, db_index=True,
    )
    source = models.CharField(
        max_length=20, choices=Source.choices, default=Source.OTHER, db_index=True,
    )
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.MEDIUM,
    )
    deal_value = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text='Estimated deal value in USD',
    )
    notes = models.TextField(blank=True, default='')

    # Ownership & assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_leads',
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_leads',
    )

    # Soft delete
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Managers
    objects = LeadManager()
    all_objects = models.Manager()  # includes deleted

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'assigned_to']),
            models.Index(fields=['source']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_deleted']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.company or 'No company'}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def soft_delete(self):
        """Soft delete this lead."""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])

    def restore(self):
        """Restore a soft-deleted lead."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'updated_at'])


class LeadAttachment(models.Model):
    """File attachments for leads."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to=get_file_upload_path)
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text='File size in bytes')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_attachments',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.original_filename} (Lead: {self.lead_id})"