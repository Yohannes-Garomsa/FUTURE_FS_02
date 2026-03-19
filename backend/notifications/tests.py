"""
Tests for the Notifications app.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from notifications.models import Notification


@pytest.fixture
def sample_notifications(db, agent_user, admin_user):
    """Create sample notifications for the agent."""
    notifications = []
    for i in range(5):
        notifications.append(
            Notification.objects.create(
                recipient=agent_user,
                notification_type='lead_assigned',
                title=f'Lead Assigned #{i+1}',
                message=f'You have been assigned lead #{i+1}.',
            )
        )
    # One for admin (should not be visible to agent)
    Notification.objects.create(
        recipient=admin_user,
        notification_type='system',
        title='System Alert',
        message='This is for admin only.',
    )
    return notifications


@pytest.mark.django_db
class TestNotificationModel:
    def test_create_notification(self, agent_user):
        notif = Notification.objects.create(
            recipient=agent_user,
            notification_type='lead_assigned',
            title='New Lead',
            message='You have a new lead.',
        )
        assert notif.is_read is False
        assert str(notif).startswith('[lead_assigned]')


@pytest.mark.django_db
class TestNotificationAPI:
    def test_list_notifications(self, authenticated_agent, sample_notifications):
        url = reverse('notification-list')
        response = authenticated_agent.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Agent should see only their notifications (5), not admin's
        assert response.data['count'] == 5

    def test_mark_read(self, authenticated_agent, sample_notifications):
        notif = sample_notifications[0]
        url = reverse('notification-mark-read', kwargs={'pk': notif.pk})
        response = authenticated_agent.post(url)
        assert response.status_code == status.HTTP_200_OK
        notif.refresh_from_db()
        assert notif.is_read is True

    def test_mark_all_read(self, authenticated_agent, sample_notifications):
        url = reverse('notification-mark-all-read')
        response = authenticated_agent.post(url)
        assert response.status_code == status.HTTP_200_OK
        unread = Notification.objects.filter(
            recipient=authenticated_agent.handler._force_user,
            is_read=False,
        ).count()
        assert unread == 0

    def test_unread_count(self, authenticated_agent, sample_notifications):
        url = reverse('notification-unread-count')
        response = authenticated_agent.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['unread_count'] == 5

    def test_agent_cannot_see_admin_notifications(
        self, authenticated_agent, sample_notifications
    ):
        """Agent should never see admin's notifications."""
        url = reverse('notification-list')
        response = authenticated_agent.get(url)
        for notif in response.data['results']:
            n = Notification.objects.get(pk=notif['id'])
            assert n.recipient == authenticated_agent.handler._force_user

    def test_unauthenticated_cannot_access(self, api_client):
        url = reverse('notification-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
