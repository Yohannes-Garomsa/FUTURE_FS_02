"""
Analytics views providing dashboard metrics with optimized queries.
Uses Django's aggregation framework to avoid N+1 queries.
"""
import logging
from datetime import timedelta

from django.db.models import Count, Sum, Q, F, Avg
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdminOrManager
from leads.models import Lead
from activities.models import Activity
from users.models import User

logger = logging.getLogger('crm')


class DashboardView(APIView):
    """
    Main dashboard metrics endpoint.
    Returns: total leads, conversion rate, revenue, leads by status, etc.
    Admin/Manager only.
    """
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)

        # Total leads (excluding deleted)
        total_leads = Lead.objects.count()
        new_leads_30d = Lead.objects.filter(created_at__gte=thirty_days_ago).count()

        # Conversion metrics
        converted_leads = Lead.objects.filter(status='converted').count()
        conversion_rate = (
            round((converted_leads / total_leads) * 100, 2)
            if total_leads > 0 else 0
        )

        # Revenue (total deal value of converted leads)
        total_revenue = Lead.objects.filter(
            status='converted',
        ).aggregate(total=Sum('deal_value'))['total'] or 0

        # Leads by status
        leads_by_status = list(
            Lead.objects.values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )

        # Leads by source
        leads_by_source = list(
            Lead.objects.values('source')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # Leads by priority
        leads_by_priority = list(
            Lead.objects.values('priority')
            .annotate(count=Count('id'))
            .order_by('priority')
        )

        # Recent activity count
        activities_30d = Activity.objects.filter(
            created_at__gte=thirty_days_ago,
        ).count()

        # Unassigned leads
        unassigned_leads = Lead.objects.filter(assigned_to__isnull=True).count()

        return Response({
            'overview': {
                'total_leads': total_leads,
                'new_leads_30d': new_leads_30d,
                'converted_leads': converted_leads,
                'conversion_rate': conversion_rate,
                'total_revenue': float(total_revenue),
                'activities_30d': activities_30d,
                'unassigned_leads': unassigned_leads,
            },
            'leads_by_status': leads_by_status,
            'leads_by_source': leads_by_source,
            'leads_by_priority': leads_by_priority,
        })


class AgentPerformanceView(APIView):
    """
    Agent performance metrics.
    Shows each agent's lead count, conversion rate, and activity count.
    Admin/Manager only.
    """
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        agents = User.objects.filter(
            role='agent', is_active=True,
        ).annotate(
            total_leads=Count('assigned_leads', filter=Q(assigned_leads__is_deleted=False)),
            converted_leads=Count(
                'assigned_leads',
                filter=Q(assigned_leads__status='converted', assigned_leads__is_deleted=False),
            ),
            total_deal_value=Sum(
                'assigned_leads__deal_value',
                filter=Q(assigned_leads__status='converted', assigned_leads__is_deleted=False),
            ),
            total_activities=Count('activities'),
        ).values(
            'id', 'email', 'first_name', 'last_name',
            'total_leads', 'converted_leads',
            'total_deal_value', 'total_activities',
        ).order_by('-converted_leads')

        # Calculate conversion rate for each agent
        performance = []
        for agent in agents:
            total = agent['total_leads']
            converted = agent['converted_leads']
            performance.append({
                **agent,
                'id': str(agent['id']),
                'full_name': f"{agent['first_name']} {agent['last_name']}".strip(),
                'conversion_rate': round((converted / total) * 100, 2) if total > 0 else 0,
                'total_deal_value': float(agent['total_deal_value'] or 0),
            })

        return Response({'agents': performance})


class LeadTrendsView(APIView):
    """
    Lead creation trends over time (monthly).
    Admin/Manager only.
    """
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        period = request.query_params.get('period', 'monthly')

        if period == 'weekly':
            trunc_fn = TruncWeek
        else:
            trunc_fn = TruncMonth

        trends = list(
            Lead.objects.annotate(period=trunc_fn('created_at'))
            .values('period')
            .annotate(
                total=Count('id'),
                converted=Count('id', filter=Q(status='converted')),
                lost=Count('id', filter=Q(status='lost')),
                revenue=Sum('deal_value', filter=Q(status='converted')),
            )
            .order_by('period')
        )

        # Serialize dates
        for trend in trends:
            trend['period'] = trend['period'].isoformat() if trend['period'] else None
            trend['revenue'] = float(trend['revenue'] or 0)

        return Response({'trends': trends, 'period': period})


class SourceConversionView(APIView):
    """
    Conversion rate by lead source — helps identify best-performing channels.
    Admin/Manager only.
    """
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        sources = list(
            Lead.objects.values('source')
            .annotate(
                total=Count('id'),
                converted=Count('id', filter=Q(status='converted')),
                total_value=Sum('deal_value', filter=Q(status='converted')),
            )
            .order_by('-converted')
        )

        for source in sources:
            total = source['total']
            source['conversion_rate'] = (
                round((source['converted'] / total) * 100, 2)
                if total > 0 else 0
            )
            source['total_value'] = float(source['total_value'] or 0)

        return Response({'source_conversion': sources})
