from rest_framework import serializers
from .models import Activity
from users.models import User
from leads.models import Lead

class ActivitySerializer(serializers.ModelSerializer):
    lead = serializers.PrimaryKeyRelatedField(queryset=Lead.objects.all())
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'lead', 'type', 'title', 'description', 'created_by', 'created_at', 'updated_at']

class ActivityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['lead', 'type', 'title', 'description']