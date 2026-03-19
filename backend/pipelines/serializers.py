"""Pipeline serializers with transition validation."""
from rest_framework import serializers
from .models import Pipeline, PipelineStage, PipelineLead, StageTransitionLog


class PipelineStageSerializer(serializers.ModelSerializer):
    """Serializer for pipeline stages."""
    lead_count = serializers.IntegerField(
        source='leads_in_stage.count', read_only=True,
    )

    class Meta:
        model = PipelineStage
        fields = [
            'id', 'pipeline', 'name', 'description', 'order',
            'color', 'is_win_stage', 'is_lost_stage',
            'lead_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PipelineSerializer(serializers.ModelSerializer):
    """Pipeline serializer with nested stages."""
    stages = PipelineStageSerializer(many=True, read_only=True)
    total_leads = serializers.SerializerMethodField()

    class Meta:
        model = Pipeline
        fields = [
            'id', 'name', 'description', 'is_active',
            'stages', 'total_leads',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_total_leads(self, obj):
        return PipelineLead.objects.filter(pipeline=obj).count()


class PipelineCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating pipelines."""

    class Meta:
        model = Pipeline
        fields = ['name', 'description']


class PipelineStageCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating stages."""

    class Meta:
        model = PipelineStage
        fields = [
            'pipeline', 'name', 'description', 'order',
            'color', 'is_win_stage', 'is_lost_stage',
        ]


class PipelineLeadSerializer(serializers.ModelSerializer):
    """Serializer for lead-pipeline association."""
    lead_name = serializers.CharField(source='lead.full_name', read_only=True)
    stage_name = serializers.CharField(source='stage.name', read_only=True)

    class Meta:
        model = PipelineLead
        fields = [
            'id', 'lead', 'lead_name', 'pipeline',
            'stage', 'stage_name', 'entered_stage_at', 'created_at',
        ]
        read_only_fields = ['id', 'entered_stage_at', 'created_at']


class MoveLeadSerializer(serializers.Serializer):
    """Serializer for the drag-and-drop move lead action."""
    stage_id = serializers.UUIDField()
    notes = serializers.CharField(required=False, default='')

    def validate_stage_id(self, value):
        if not PipelineStage.objects.filter(pk=value).exists():
            raise serializers.ValidationError('Stage not found.')
        return value


class StageTransitionLogSerializer(serializers.ModelSerializer):
    """Serializer for stage transition audit log."""
    from_stage_name = serializers.CharField(
        source='from_stage.name', read_only=True, default=None,
    )
    to_stage_name = serializers.CharField(
        source='to_stage.name', read_only=True, default=None,
    )
    transitioned_by_name = serializers.CharField(
        source='transitioned_by.full_name', read_only=True, default=None,
    )

    class Meta:
        model = StageTransitionLog
        fields = [
            'id', 'from_stage', 'from_stage_name',
            'to_stage', 'to_stage_name',
            'transitioned_by', 'transitioned_by_name',
            'transitioned_at', 'notes',
        ]


class StageReorderSerializer(serializers.Serializer):
    """Serializer for reordering stages (drag-and-drop)."""
    stage_ids = serializers.ListField(
        child=serializers.UUIDField(),
        help_text='Ordered list of stage UUIDs',
    )
