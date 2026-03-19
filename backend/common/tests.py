"""
Tests for the common permissions module.
"""
import pytest
from unittest.mock import MagicMock
from common.permissions import (
    IsAdmin,
    IsManager,
    IsAdminOrManager,
    IsOwnerOrAdmin,
    IsSelfOrAdmin,
)
from users.models import User


@pytest.mark.django_db
class TestPermissions:
    def _make_request(self, user):
        request = MagicMock()
        request.user = user
        return request

    def test_is_admin_allows_admin(self, admin_user):
        perm = IsAdmin()
        request = self._make_request(admin_user)
        assert perm.has_permission(request, None) is True

    def test_is_admin_denies_agent(self, agent_user):
        perm = IsAdmin()
        request = self._make_request(agent_user)
        assert perm.has_permission(request, None) is False

    def test_is_manager_allows_manager(self, manager_user):
        perm = IsManager()
        request = self._make_request(manager_user)
        assert perm.has_permission(request, None) is True

    def test_is_admin_or_manager_allows_both(self, admin_user, manager_user):
        perm = IsAdminOrManager()
        assert perm.has_permission(self._make_request(admin_user), None) is True
        assert perm.has_permission(self._make_request(manager_user), None) is True

    def test_is_admin_or_manager_denies_agent(self, agent_user):
        perm = IsAdminOrManager()
        assert perm.has_permission(self._make_request(agent_user), None) is False

    def test_is_self_or_admin(self, admin_user, agent_user):
        perm = IsSelfOrAdmin()
        request_admin = self._make_request(admin_user)
        request_agent = self._make_request(agent_user)

        # Admin can access any user object
        assert perm.has_object_permission(request_admin, None, agent_user) is True
        # Agent can access only themselves
        assert perm.has_object_permission(request_agent, None, agent_user) is True
        # Agent cannot access admin's profile
        assert perm.has_object_permission(request_agent, None, admin_user) is False

    def test_is_owner_or_admin(self, admin_user, agent_user, sample_lead):
        perm = IsOwnerOrAdmin()
        request_admin = self._make_request(admin_user)
        request_agent = self._make_request(agent_user)

        # Admin can access any lead
        assert perm.has_object_permission(request_admin, None, sample_lead) is True
        # Agent can access leads assigned to them
        assert perm.has_object_permission(request_agent, None, sample_lead) is True
