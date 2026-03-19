"""
Comprehensive tests for the Leads app.
Tests: model, soft delete, API endpoints, RBAC, filtering.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from leads.models import Lead


# =============================================================================
# MODEL TESTS
# =============================================================================
@pytest.mark.django_db
class TestLeadModel:
    def test_create_lead(self, admin_user):
        lead = Lead.objects.create(
            first_name='Jane',
            last_name='Smith',
            email='jane@example.com',
            company='Tech Inc',
            created_by=admin_user,
        )
        assert lead.full_name == 'Jane Smith'
        assert lead.status == 'new'
        assert lead.is_deleted is False

    def test_soft_delete(self, sample_lead):
        sample_lead.soft_delete()
        assert sample_lead.is_deleted is True
        assert sample_lead.deleted_at is not None
        # Should NOT appear in default queryset
        assert Lead.objects.filter(pk=sample_lead.pk).count() == 0
        # Should appear in all_objects
        assert Lead.all_objects.filter(pk=sample_lead.pk).count() == 1

    def test_restore(self, sample_lead):
        sample_lead.soft_delete()
        sample_lead.restore()
        assert sample_lead.is_deleted is False
        assert sample_lead.deleted_at is None
        assert Lead.objects.filter(pk=sample_lead.pk).count() == 1

    def test_uuid_primary_key(self, sample_lead):
        import uuid
        assert isinstance(sample_lead.pk, uuid.UUID)


# =============================================================================
# API TESTS
# =============================================================================
@pytest.mark.django_db
class TestLeadAPI:
    def test_create_lead(self, authenticated_admin):
        url = reverse('lead-list')
        data = {
            'first_name': 'New',
            'last_name': 'Lead',
            'email': 'new@lead.com',
            'company': 'Test Corp',
            'status': 'new',
            'source': 'website',
            'priority': 'high',
            'deal_value': '25000.00',
        }
        response = authenticated_admin.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Lead.objects.filter(email='new@lead.com').exists()

    def test_list_leads(self, authenticated_admin, sample_lead):
        url = reverse('lead-list')
        response = authenticated_admin.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_retrieve_lead(self, authenticated_admin, sample_lead):
        url = reverse('lead-detail', kwargs={'pk': sample_lead.pk})
        response = authenticated_admin.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'john@example.com'

    def test_update_lead(self, authenticated_admin, sample_lead):
        url = reverse('lead-detail', kwargs={'pk': sample_lead.pk})
        data = {'status': 'contacted'}
        response = authenticated_admin.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        sample_lead.refresh_from_db()
        assert sample_lead.status == 'contacted'

    def test_delete_is_soft_delete(self, authenticated_admin, sample_lead):
        url = reverse('lead-detail', kwargs={'pk': sample_lead.pk})
        response = authenticated_admin.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        # Should still exist in DB
        assert Lead.all_objects.filter(pk=sample_lead.pk).exists()
        lead = Lead.all_objects.get(pk=sample_lead.pk)
        assert lead.is_deleted is True


# =============================================================================
# RBAC TESTS
# =============================================================================
@pytest.mark.django_db
class TestLeadRBAC:
    def test_agent_sees_only_assigned_leads(
        self, authenticated_agent, sample_lead, admin_user
    ):
        """Agent should only see leads assigned to them."""
        # Create an unassigned lead
        Lead.objects.create(
            first_name='Other',
            last_name='Lead',
            email='other@example.com',
            created_by=admin_user,
        )
        url = reverse('lead-list')
        response = authenticated_agent.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Agent should see only the lead assigned to them
        for lead_data in response.data['results']:
            lead = Lead.objects.get(pk=lead_data['id'])
            assert lead.assigned_to_id == authenticated_agent.handler._force_user.pk

    def test_admin_sees_all_leads(
        self, authenticated_admin, sample_lead, admin_user
    ):
        Lead.objects.create(
            first_name='Extra',
            last_name='Lead',
            email='extra@example.com',
            created_by=admin_user,
        )
        url = reverse('lead-list')
        response = authenticated_admin.get(url)
        assert response.data['count'] >= 2

    def test_agent_cannot_delete_lead(self, authenticated_agent, sample_lead):
        url = reverse('lead-detail', kwargs={'pk': sample_lead.pk})
        response = authenticated_agent.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unauthenticated_cannot_access(self, api_client):
        url = reverse('lead-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# =============================================================================
# FILTERING TESTS
# =============================================================================
@pytest.mark.django_db
class TestLeadFiltering:
    def test_filter_by_status(self, authenticated_admin, sample_lead):
        url = reverse('lead-list')
        response = authenticated_admin.get(url, {'status': 'new'})
        assert response.status_code == status.HTTP_200_OK
        for lead in response.data['results']:
            assert lead['status'] == 'new'

    def test_search_by_name(self, authenticated_admin, sample_lead):
        url = reverse('lead-list')
        response = authenticated_admin.get(url, {'search': 'John'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1
