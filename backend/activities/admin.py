from django.contrib import admin
from .models import Activity


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('title', 'activity_type', 'lead', 'completed', 'scheduled_at', 'created_by', 'created_at')
    list_filter = ('activity_type', 'completed')
    search_fields = ('title', 'description')
    raw_id_fields = ('lead', 'created_by')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
