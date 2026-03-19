"""
Celery configuration for the CRM project.
Uses Redis as the message broker.
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_project.settings')

app = Celery('crm_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat scheduled tasks
app.conf.beat_schedule = {
    'send-daily-digest': {
        'task': 'notifications.tasks.send_daily_digest',
        'schedule': crontab(hour=8, minute=0),  # Every day at 8 AM
    },
}
