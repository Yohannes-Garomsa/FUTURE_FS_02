"""
Centralized exception handling for the CRM API.
Provides consistent error response format across all endpoints.
"""
import logging

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('crm')


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error responses.

    Response format:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Human-readable message",
            "details": { ... }  // optional
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'success': False,
            'error': {
                'code': _get_error_code(response.status_code),
                'message': _get_error_message(response),
                'details': response.data if isinstance(response.data, dict) else {'errors': response.data},
            }
        }
        response.data = error_data
    else:
        # Unhandled exception — log and return 500
        logger.exception(
            'Unhandled exception in %s',
            context.get('view', 'unknown'),
            exc_info=exc,
        )
        response = Response(
            {
                'success': False,
                'error': {
                    'code': 'INTERNAL_SERVER_ERROR',
                    'message': 'An unexpected error occurred. Please try again later.',
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response


def _get_error_code(status_code):
    """Map HTTP status codes to error code strings."""
    error_codes = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        405: 'METHOD_NOT_ALLOWED',
        409: 'CONFLICT',
        429: 'RATE_LIMITED',
        500: 'INTERNAL_SERVER_ERROR',
    }
    return error_codes.get(status_code, f'ERROR_{status_code}')


def _get_error_message(response):
    """Extract a human-readable message from the response data."""
    if isinstance(response.data, dict):
        if 'detail' in response.data:
            return str(response.data['detail'])
        if 'non_field_errors' in response.data:
            errors = response.data['non_field_errors']
            return str(errors[0]) if errors else 'Validation error'
    if isinstance(response.data, list):
        return str(response.data[0]) if response.data else 'An error occurred'
    return 'An error occurred'
