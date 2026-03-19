"""Lead serializers with proper validation and nested serialization."""
from rest_framework import serializers
from .models import Lead, LeadAttachment
from common.utils import validate_file_extension, validate_file_size


class LeadAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for lead file attachments."""
    uploaded_by_name = serializers.CharField(
        source='uploaded_by.full_name', read_only=True
    )

    class Meta:
        model = LeadAttachment
        fields = [
            'id', 'file', 'original_filename', 'file_size',
            'uploaded_by', 'uploaded_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'original_filename', 'file_size', 'uploaded_by', 'created_at']


class LeadAttachmentUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading attachments."""

    class Meta:
        model = LeadAttachment
        fields = ['file']

    def validate_file(self, value):
        validate_file_extension(value.name)
        validate_file_size(value)
        return value


class LeadSerializer(serializers.ModelSerializer):
    """Full lead serializer with nested data."""
    full_name = serializers.CharField(read_only=True)
    assigned_to_name = serializers.CharField(
        source='assigned_to.full_name', read_only=True, default=None,
    )
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True, default=None,
    )
    attachment_count = serializers.IntegerField(
        source='attachments.count', read_only=True,
    )

    class Meta:
        model = Lead
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'company', 'job_title',
            'status', 'source', 'priority', 'deal_value', 'notes',
            'assigned_to', 'assigned_to_name',
            'created_by', 'created_by_name',
            'is_deleted', 'attachment_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'created_by', 'is_deleted', 'created_at', 'updated_at',
        ]


class LeadCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating leads."""

    class Meta:
        model = Lead
        fields = [
            'first_name', 'last_name', 'email', 'phone',
            'company', 'job_title', 'status', 'source',
            'priority', 'deal_value', 'notes', 'assigned_to',
        ]

    def validate_email(self, value):
        # Warn if lead with same email already exists (but allow it)
        if Lead.objects.filter(email=value).exists():
            # Don't block, just note it — sales teams may re-engage old leads
            pass
        return value


class LeadUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating leads."""

    class Meta:
        model = Lead
        fields = [
            'first_name', 'last_name', 'email', 'phone',
            'company', 'job_title', 'status', 'source',
            'priority', 'deal_value', 'notes', 'assigned_to',
        ]


class LeadListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (fewer fields, faster)."""
    full_name = serializers.CharField(read_only=True)
    assigned_to_name = serializers.CharField(
        source='assigned_to.full_name', read_only=True, default=None,
    )

    class Meta:
        model = Lead
        fields = [
            'id', 'full_name', 'email', 'company',
            'status', 'source', 'priority', 'deal_value',
            'assigned_to', 'assigned_to_name',
            'created_at',
        ]