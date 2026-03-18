from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:pk>/assign/', LeadViewSet.as_view({'patch': 'assign'}), name='lead-assign'),
    path('<int:pk>/activities/', LeadViewSet.as_view({'get': 'activities'}), name='lead-activities'),
]