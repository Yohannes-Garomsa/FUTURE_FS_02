from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PipelineViewSet, PipelineStageViewSet, PipelineLeadViewSet

router = DefaultRouter()
router.register(r'pipelines', PipelineViewSet, basename='pipeline')
router.register(r'pipeline-stages', PipelineStageViewSet, basename='pipeline-stage')
router.register(r'pipeline-leads', PipelineLeadViewSet, basename='pipeline-lead')

urlpatterns = [
    path('', include(router.urls)),
]
