"""
Comprehensive tests for the Users app.
Tests: model, serializers, API endpoints, and RBAC permissions.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from users.models import User


# =============================================================================
# MODEL TESTS
# =============================================================================
@pytest.mark.django_db
class TestUserModel:
    def test_create_user(self):
        user = User.objects.create_user(
            email='test@example.com',
            password='testpass123!',
            first_name='Test',
            last_name='User',
        )
        assert user.email == 'test@example.com'
        assert user.role == 'agent'  # default role
        assert user.is_active is True
        assert user.is_staff is False
        assert user.check_password('testpass123!')

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email='super@example.com',
            password='superpass123!',
            first_name='Super',
            last_name='User',
        )
        assert user.role == 'admin'
        assert user.is_staff is True
        assert user.is_superuser is True

    def test_user_full_name(self):
        user = User(first_name='John', last_name='Doe')
        assert user.full_name == 'John Doe'

    def test_user_role_properties(self):
        admin = User(role='admin')
        assert admin.is_admin is True
        assert admin.is_manager is False

        manager = User(role='manager')
        assert manager.is_manager is True

        agent = User(role='agent')
        assert agent.is_agent is True

    def test_email_is_required(self):
        with pytest.raises(ValueError, match='email'):
            User.objects.create_user(email='', password='test123!')

    def test_uuid_primary_key(self):
        user = User.objects.create_user(
            email='uuid@test.com',
            password='testpass123!',
            first_name='UUID',
            last_name='Test',
        )
        import uuid
        assert isinstance(user.pk, uuid.UUID)


# =============================================================================
# API TESTS
# =============================================================================
@pytest.mark.django_db
class TestUserAPI:
    def test_register_user(self, api_client):
        """Anyone can register."""
        url = reverse('user-list')
        data = {
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='new@example.com').exists()

    def test_register_password_mismatch(self, api_client):
        url = reverse('user-list')
        data = {
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'StrongPass123!',
            'password_confirm': 'WrongPass123!',
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_me(self, authenticated_agent, agent_user):
        """Authenticated users can get their profile."""
        url = reverse('user-me')
        response = authenticated_agent.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == agent_user.email

    def test_change_password(self, authenticated_agent):
        url = reverse('user-change-password')
        data = {
            'old_password': 'testpass123!',
            'new_password': 'NewStrongPass456!',
            'new_password_confirm': 'NewStrongPass456!',
        }
        response = authenticated_agent.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK


# =============================================================================
# RBAC TESTS
# =============================================================================
@pytest.mark.django_db
class TestUserRBAC:
    def test_agent_cannot_list_users(self, authenticated_agent):
        """Agents should not be able to list all users."""
        url = reverse('user-list')
        response = authenticated_agent.get(url)
        # Agent queryset only returns themselves
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_list_users(self, authenticated_admin):
        url = reverse('user-list')
        response = authenticated_admin.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_manager_can_list_users(self, authenticated_manager):
        url = reverse('user-list')
        response = authenticated_manager.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_admin_can_assign_role(self, authenticated_admin, agent_user):
        url = reverse('user-assign-role', kwargs={'pk': agent_user.pk})
        data = {'role': 'manager'}
        response = authenticated_admin.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        agent_user.refresh_from_db()
        assert agent_user.role == 'manager'

    def test_agent_cannot_assign_role(self, authenticated_agent, agent_user):
        url = reverse('user-assign-role', kwargs={'pk': agent_user.pk})
        data = {'role': 'admin'}
        response = authenticated_agent.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_agent_cannot_delete_user(self, authenticated_agent, agent_user):
        url = reverse('user-detail', kwargs={'pk': agent_user.pk})
        response = authenticated_agent.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_access(self, api_client):
        url = reverse('user-me')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
