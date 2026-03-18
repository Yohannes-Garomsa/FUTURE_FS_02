from rest_framework import serializers
from .models import Lead
from users.models import User

class LeadSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Lead
        fields = ['id', 'name', 'email', 'phone', 'company', 'status', 'assigned_to', 'created_by', 'created_at', 'updated_at']

class LeadCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['name', 'email', 'phone', 'company', 'status', 'assigned_to']

class LeadUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['name', 'email', 'phone', 'company', 'status', 'assigned_to']