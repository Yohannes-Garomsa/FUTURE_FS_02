from django.contrib import admin
from .models import Pipeline, PipelineStage, PipelineLead, StageTransitionLog


@admin.register(Pipeline)
class PipelineAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_by', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(PipelineStage)
class PipelineStageAdmin(admin.ModelAdmin):
    list_display = ('name', 'pipeline', 'order', 'is_win_stage', 'is_lost_stage', 'color')
    list_filter = ('pipeline', 'is_win_stage', 'is_lost_stage')
    ordering = ('pipeline', 'order')


@admin.register(PipelineLead)
class PipelineLeadAdmin(admin.ModelAdmin):
    list_display = ('lead', 'pipeline', 'stage', 'entered_stage_at')
    list_filter = ('pipeline', 'stage')
    raw_id_fields = ('lead',)


@admin.register(StageTransitionLog)
class StageTransitionLogAdmin(admin.ModelAdmin):
    list_display = ('pipeline_lead', 'from_stage', 'to_stage', 'transitioned_by', 'transitioned_at')
    readonly_fields = ('transitioned_at',)
