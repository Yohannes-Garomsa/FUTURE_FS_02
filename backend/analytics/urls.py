from django.urls import path
from .views import (
    DashboardView,
    AgentPerformanceView,
    LeadTrendsView,
    SourceConversionView,
)

urlpatterns = [
    path('analytics/dashboard/', DashboardView.as_view(), name='analytics-dashboard'),
    path('analytics/agent-performance/', AgentPerformanceView.as_view(), name='analytics-agent-performance'),
    path('analytics/lead-trends/', LeadTrendsView.as_view(), name='analytics-lead-trends'),
    path('analytics/source-conversion/', SourceConversionView.as_view(), name='analytics-source-conversion'),
]
