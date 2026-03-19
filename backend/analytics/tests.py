"""
Tests for the Analytics app.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from leads.models import Lead


@pytest.fixture
def analytics_data(db, admin_user, agent_user):
    """Create varied leads for analytics testing."""
    leads = []
    statuses = ['new', 'contacted', 'qualified', 'converted', 'lost']
    sources = ['website', 'referral', 'cold_call', 'social_media']
    for i in range(20):
        leads.append(Lead.objects.create(
            first_name=f'Lead{i}',
            last_name=f'Test{i}',
            email=f'lead{i}@test.com',
            company=f'Company{i}',
            status=statuses[i % len(statuses)],
            source=sources[i % len(sources)],
            priority='medium',
            deal_value=1000 * (i + 1),
            assigned_to=agent_user,
            created_by=admin_user,
        ))
    return leads


@pytest.mark.django_db
class TestDashboardAnalytics:
    def test_dashboard_as_admin(self, authenticated_admin, analytics_data):
        url = reverse('analytics-dashboard')
        response = authenticated_admin.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'overview' in response.data
        assert response.data['overview']['total_leads'] == 20
        assert 'leads_by_status' in response.data
        assert 'leads_by_source' in response.data

    def test_dashboard_denied_for_agent(self, authenticated_agent):
        url = reverse('analytics-dashboard')
        response = authenticated_agent.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_conversion_rate(self, authenticated_admin, analytics_data):
        url = reverse('analytics-dashboard')
        response = authenticated_admin.get(url)
        overview = response.data['overview']
        # 4 out of 20 leads are 'converted' (indices 3,8,13,18)
        assert overview['converted_leads'] == 4
        assert overview['conversion_rate'] == 20.0


@pytest.mark.django_db
class TestAgentPerformance:
    def test_agent_performance(self, authenticated_admin, analytics_data):
        url = reverse('analytics-agent-performance')
        response = authenticated_admin.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'agents' in response.data
        assert len(response.data['agents']) >= 1

    def test_agent_performance_denied_for_agent(self, authenticated_agent):
        url = reverse('analytics-agent-performance')
        response = authenticated_agent.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestLeadTrends:
    def test_lead_trends_monthly(self, authenticated_admin, analytics_data):
        url = reverse('analytics-lead-trends')
        response = authenticated_admin.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'trends' in response.data
        assert response.data['period'] == 'monthly'

    def test_lead_trends_weekly(self, authenticated_admin, analytics_data):
        url = reverse('analytics-lead-trends')
        response = authenticated_admin.get(url, {'period': 'weekly'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['period'] == 'weekly'


@pytest.mark.django_db
class TestSourceConversion:
    def test_source_conversion(self, authenticated_admin, analytics_data):
        url = reverse('analytics-source-conversion')
        response = authenticated_admin.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'source_conversion' in response.data
        for source in response.data['source_conversion']:
            assert 'conversion_rate' in source
            assert 'total_value' in source
