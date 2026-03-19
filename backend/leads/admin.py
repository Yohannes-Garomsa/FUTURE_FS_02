from django.contrib import admin
from .models import Lead, LeadAttachment


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        'full_name', 'email', 'company', 'status',
        'priority', 'assigned_to', 'created_at', 'is_deleted',
    )
    list_filter = ('status', 'source', 'priority', 'is_deleted')
    search_fields = ('first_name', 'last_name', 'email', 'company')
    raw_id_fields = ('assigned_to', 'created_by')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at', 'deleted_at')


@admin.register(LeadAttachment)
class LeadAttachmentAdmin(admin.ModelAdmin):
    list_display = ('original_filename', 'lead', 'file_size', 'uploaded_by', 'created_at')
    raw_id_fields = ('lead', 'uploaded_by')
    readonly_fields = ('created_at',)
