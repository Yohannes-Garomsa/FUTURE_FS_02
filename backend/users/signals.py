"""User signals — placeholder for post-registration hooks."""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User

logger = logging.getLogger('crm')


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """Log new user creation."""
    if created:
        logger.info('New user created: %s (role=%s)', instance.email, instance.role)
