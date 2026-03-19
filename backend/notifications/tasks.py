"""
Celery tasks for notifications and email sending.
These run asynchronously via Celery + Redis.
"""
import logging
from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger('crm')


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_lead_assigned(self, lead_id, user_id):
    """Create a notification when a lead is assigned to a user."""
    try:
        from leads.models import Lead
        from users.models import User
        from notifications.models import Notification

        lead = Lead.all_objects.get(pk=lead_id)
        user = User.objects.get(pk=user_id)

        Notification.objects.create(
            recipient=user,
            notification_type='lead_assigned',
            title='New Lead Assigned',
            message=f'You have been assigned a new lead: {lead.full_name} ({lead.company or "No company"}).',
            related_lead_id=lead.pk,
        )

        # Send email notification
        if user.email:
            send_lead_assignment_email.delay(str(lead.pk), str(user.pk))

        logger.info('Lead assignment notification sent to %s for lead %s', user.email, lead.full_name)
    except Exception as exc:
        logger.error('Failed to send lead assignment notification: %s', exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def notify_lead_status_changed(self, lead_id, old_status, new_status):
    """Create notifications when a lead's status changes."""
    try:
        from leads.models import Lead
        from notifications.models import Notification

        lead = Lead.all_objects.get(pk=lead_id)

        # Notify the assigned agent
        if lead.assigned_to:
            Notification.objects.create(
                recipient=lead.assigned_to,
                notification_type='lead_status_changed',
                title='Lead Status Changed',
                message=f'Lead "{lead.full_name}" status changed from {old_status} to {new_status}.',
                related_lead_id=lead.pk,
            )

        # Notify the creator if different from assigned
        if lead.created_by and lead.created_by != lead.assigned_to:
            Notification.objects.create(
                recipient=lead.created_by,
                notification_type='lead_status_changed',
                title='Lead Status Changed',
                message=f'Lead "{lead.full_name}" status changed from {old_status} to {new_status}.',
                related_lead_id=lead.pk,
            )

        logger.info('Status change notification sent for lead %s: %s → %s', lead.full_name, old_status, new_status)
    except Exception as exc:
        logger.error('Failed to send status change notification: %s', exc)
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def send_lead_assignment_email(self, lead_id, user_id):
    """Send email notification for lead assignment."""
    try:
        from leads.models import Lead
        from users.models import User

        lead = Lead.all_objects.get(pk=lead_id)
        user = User.objects.get(pk=user_id)

        subject = f'New Lead Assigned: {lead.full_name}'
        message = (
            f'Hi {user.full_name},\n\n'
            f'You have been assigned a new lead:\n\n'
            f'Name: {lead.full_name}\n'
            f'Email: {lead.email}\n'
            f'Company: {lead.company or "N/A"}\n'
            f'Phone: {lead.phone or "N/A"}\n\n'
            f'Please follow up as soon as possible.\n\n'
            f'— CRM System'
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        logger.info('Assignment email sent to %s for lead %s', user.email, lead.full_name)
    except Exception as exc:
        logger.error('Failed to send assignment email: %s', exc)
        raise self.retry(exc=exc)


@shared_task
def send_daily_digest():
    """
    Send a daily digest email to all agents with their pending leads.
    Scheduled via Celery Beat.
    """
    from users.models import User
    from leads.models import Lead

    agents = User.objects.filter(role='agent', is_active=True)
    for agent in agents:
        pending_leads = Lead.objects.filter(
            assigned_to=agent,
            status__in=['new', 'contacted', 'qualified'],
        ).count()

        if pending_leads > 0:
            send_mail(
                subject=f'Daily Digest: {pending_leads} pending leads',
                message=(
                    f'Hi {agent.full_name},\n\n'
                    f'You have {pending_leads} pending leads that need attention.\n'
                    f'Please log in to review them.\n\n'
                    f'— CRM System'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[agent.email],
                fail_silently=True,
            )

    logger.info('Daily digest sent to %d agents', agents.count())
