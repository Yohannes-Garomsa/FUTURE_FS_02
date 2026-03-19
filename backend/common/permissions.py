"""
Custom DRF permissions for Role-Based Access Control (RBAC).

Roles:
    - admin: Full access to everything
    - manager: Manage leads + limited user management
    - agent: Only assigned leads
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to users with 'admin' role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsManager(BasePermission):
    """Allow access to users with 'manager' role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'manager'
        )


class IsAdminOrManager(BasePermission):
    """Allow access to admins and managers."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('admin', 'manager')
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: allow access if user is the owner of the
    lead (assigned_to) or is an admin/manager.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'manager'):
            return True
        # Check if the object has assigned_to field
        if hasattr(obj, 'assigned_to'):
            return obj.assigned_to == request.user
        # Check if the object has created_by field
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        return False


class IsLeadOwnerOrAdmin(BasePermission):
    """
    Object-level permission for lead-related objects.
    Checks the lead's assigned_to or created_by.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in ('admin', 'manager'):
            return True
        # For Lead objects
        if hasattr(obj, 'assigned_to'):
            return obj.assigned_to == request.user
        # For objects linked to a lead (Activity, etc.)
        if hasattr(obj, 'lead'):
            lead = obj.lead
            return lead.assigned_to == request.user or obj.created_by == request.user
        return False


class IsSelfOrAdmin(BasePermission):
    """Allow users to modify only their own profile, admins can modify any."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj == request.user
