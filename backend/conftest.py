"""
pytest configuration for the CRM project.
"""
import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    """Return a DRF API client."""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create and return an admin user."""
    from users.models import User
    return User.objects.create_user(
        email='admin@test.com',
        password='testpass123!',
        first_name='Admin',
        last_name='User',
        role='admin',
        is_staff=True,
    )


@pytest.fixture
def manager_user(db):
    """Create and return a manager user."""
    from users.models import User
    return User.objects.create_user(
        email='manager@test.com',
        password='testpass123!',
        first_name='Manager',
        last_name='User',
        role='manager',
    )


@pytest.fixture
def agent_user(db):
    """Create and return a sales agent user."""
    from users.models import User
    return User.objects.create_user(
        email='agent@test.com',
        password='testpass123!',
        first_name='Agent',
        last_name='User',
        role='agent',
    )


@pytest.fixture
def agent_user_2(db):
    """Create and return a second sales agent."""
    from users.models import User
    return User.objects.create_user(
        email='agent2@test.com',
        password='testpass123!',
        first_name='Agent2',
        last_name='User',
        role='agent',
    )


@pytest.fixture
def authenticated_admin(api_client, admin_user):
    """Return an API client authenticated as admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def authenticated_manager(api_client, manager_user):
    """Return an API client authenticated as manager."""
    api_client.force_authenticate(user=manager_user)
    return api_client


@pytest.fixture
def authenticated_agent(api_client, agent_user):
    """Return an API client authenticated as agent."""
    api_client.force_authenticate(user=agent_user)
    return api_client


@pytest.fixture
def sample_lead(db, admin_user, agent_user):
    """Create and return a sample lead."""
    from leads.models import Lead
    return Lead.objects.create(
        first_name='John',
        last_name='Doe',
        email='john@example.com',
        phone='+1234567890',
        company='Acme Corp',
        status='new',
        source='website',
        priority='medium',
        deal_value=10000,
        assigned_to=agent_user,
        created_by=admin_user,
    )


@pytest.fixture
def sample_activity(db, sample_lead, agent_user):
    """Create and return a sample activity."""
    from activities.models import Activity
    return Activity.objects.create(
        lead=sample_lead,
        activity_type='call',
        title='Initial call',
        description='First contact with the lead.',
        created_by=agent_user,
    )
