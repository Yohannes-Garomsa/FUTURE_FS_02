from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ActivityViewSet

router = DefaultRouter()
router.register(r'activities', ActivityViewSet, basename='activity')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:pk>/by-lead/', ActivityViewSet.as_view({'get': 'by_lead'}), name='activity-by-lead'),
]