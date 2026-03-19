"""
User ViewSet with full RBAC enforcement.

- Registration: open (AllowAny)
- Profile (me): authenticated user only
- List users: admin/manager only
- Retrieve user: admin/manager or self
- Update user: admin or self
- Delete user: admin only
- Assign role: admin only
- Change password: authenticated (self only)
"""
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsAdmin, IsAdminOrManager, IsSelfOrAdmin
from .models import User
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    AssignRoleSerializer,
    UserListSerializer,
)

logger = logging.getLogger('crm')


class UserViewSet(viewsets.ModelViewSet):
    """
    User management endpoints with strict RBAC.
    """
    serializer_class = UserSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return User.objects.none()

        # Admins and managers can see all users
        if user.role in ('admin', 'manager'):
            return User.objects.all()
        # Agents can only see themselves
        return User.objects.filter(pk=user.pk)

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        if self.action in ['list']:
            return [IsAdminOrManager()]
        if self.action == 'destroy':
            return [IsAdmin()]
        if self.action == 'assign_role':
            return [IsAdmin()]
        if self.action in ['retrieve', 'update', 'partial_update']:
            return [IsSelfOrAdmin()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        if self.action == 'list':
            return UserListSerializer
        if self.action == 'assign_role':
            return AssignRoleSerializer
        if self.action == 'change_password':
            return ChangePasswordSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        logger.info('New user registered: %s', user.email)

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        """Get or update the currently authenticated user's profile."""
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        # PATCH
        serializer = UserUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    @action(detail=True, methods=['post'], url_path='assign-role')
    def assign_role(self, request, pk=None):
        """Assign a role to a user (admin only)."""
        user = self.get_object()
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.role = serializer.validated_data['role']
        # Sync is_staff with admin role
        user.is_staff = (user.role == 'admin')
        user.save(update_fields=['role', 'is_staff', 'updated_at'])
        logger.info(
            'Role %s assigned to user %s by %s',
            user.role, user.email, request.user.email,
        )
        return Response(
            {'message': f'Role "{user.role}" assigned to {user.email}.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """Change the authenticated user's password."""
        serializer = ChangePasswordSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password', 'updated_at'])
        logger.info('Password changed for user %s', request.user.email)
        return Response(
            {'message': 'Password changed successfully.'},
            status=status.HTTP_200_OK,
        )