"""Activity serializers."""
from rest_framework import serializers
from .models import Activity


class ActivitySerializer(serializers.ModelSerializer):
    """Full activity serializer with readable foreign key names."""
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True, default=None,
    )
    lead_name = serializers.CharField(
        source='lead.full_name', read_only=True,
    )
    activity_type_display = serializers.CharField(
        source='get_activity_type_display', read_only=True,
    )

    class Meta:
        model = Activity
        fields = [
            'id', 'lead', 'lead_name',
            'activity_type', 'activity_type_display',
            'title', 'description',
            'scheduled_at', 'completed',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class ActivityCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating activities."""

    class Meta:
        model = Activity
        fields = [
            'lead', 'activity_type', 'title', 'description',
            'scheduled_at', 'completed',
        ]

    def validate(self, attrs):
        # Meetings should have a scheduled_at
        if attrs.get('activity_type') == 'meeting' and not attrs.get('scheduled_at'):
            raise serializers.ValidationError({
                'scheduled_at': 'Scheduled time is required for meetings.',
            })
        return attrs


class ActivityListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    activity_type_display = serializers.CharField(
        source='get_activity_type_display', read_only=True,
    )
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True, default=None,
    )

    class Meta:
        model = Activity
        fields = [
            'id', 'lead', 'activity_type', 'activity_type_display',
            'title', 'scheduled_at', 'completed',
            'created_by_name', 'created_at',
        ]