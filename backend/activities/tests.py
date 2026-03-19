"""
Tests for the Activities app.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from activities.models import Activity


@pytest.mark.django_db
class TestActivityModel:
    def test_create_activity(self, sample_lead, agent_user):
        activity = Activity.objects.create(
            lead=sample_lead,
            activity_type='call',
            title='Follow-up call',
            created_by=agent_user,
        )
        assert str(activity) == 'Phone Call — Follow-up call'
        assert activity.completed is False

    def test_uuid_pk(self, sample_activity):
        import uuid
        assert isinstance(sample_activity.pk, uuid.UUID)


@pytest.mark.django_db
class TestActivityAPI:
    def test_create_activity(self, authenticated_agent, sample_lead):
        url = reverse('activity-list')
        data = {
            'lead': str(sample_lead.pk),
            'activity_type': 'note',
            'title': 'Test note',
            'description': 'Some description',
        }
        response = authenticated_agent.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_list_activities(self, authenticated_agent, sample_activity):
        url = reverse('activity-list')
        response = authenticated_agent.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_meeting_requires_scheduled_at(self, authenticated_agent, sample_lead):
        url = reverse('activity-list')
        data = {
            'lead': str(sample_lead.pk),
            'activity_type': 'meeting',
            'title': 'Team meeting',
        }
        response = authenticated_agent.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestActivityRBAC:
    def test_agent_sees_only_their_lead_activities(
        self, authenticated_agent, sample_activity, admin_user
    ):
        """Agent should only see activities on their assigned leads."""
        from leads.models import Lead
        # Create a lead not assigned to the agent
        other_lead = Lead.objects.create(
            first_name='Other',
            last_name='Person',
            email='other@test.com',
            created_by=admin_user,
        )
        Activity.objects.create(
            lead=other_lead,
            activity_type='note',
            title='Agent should not see this',
            created_by=admin_user,
        )
        url = reverse('activity-list')
        response = authenticated_agent.get(url)
        # All returned activities should be on the agent's assigned leads
        for act in response.data['results']:
            activity = Activity.objects.get(pk=act['id'])
            assert activity.lead.assigned_to == authenticated_agent.handler._force_user
