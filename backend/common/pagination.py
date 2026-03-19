"""Custom pagination classes for the CRM API."""
from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Standard pagination for list endpoints."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class SmallPagination(PageNumberPagination):
    """Smaller pagination for lightweight lists (notifications, etc.)."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class LargePagination(PageNumberPagination):
    """Larger pagination for analytics/export endpoints."""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
