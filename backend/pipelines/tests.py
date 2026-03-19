"""
Tests for the Pipelines app.
Tests: models, API endpoints, drag-and-drop move, stage transitions.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from pipelines.models import Pipeline, PipelineStage, PipelineLead


@pytest.fixture
def sample_pipeline(db, admin_user):
    """Create a sample pipeline with stages."""
    pipeline = Pipeline.objects.create(
        name='Default Sales Pipeline',
        description='Standard sales pipeline',
        created_by=admin_user,
    )
    PipelineStage.objects.create(
        pipeline=pipeline, name='Prospecting', order=0, color='#3B82F6',
    )
    PipelineStage.objects.create(
        pipeline=pipeline, name='Qualification', order=1, color='#8B5CF6',
    )
    PipelineStage.objects.create(
        pipeline=pipeline, name='Proposal', order=2, color='#F59E0B',
    )
    PipelineStage.objects.create(
        pipeline=pipeline, name='Closing', order=3, color='#10B981', is_win_stage=True,
    )
    PipelineStage.objects.create(
        pipeline=pipeline, name='Lost', order=4, color='#EF4444', is_lost_stage=True,
    )
    return pipeline


@pytest.fixture
def pipeline_lead_entry(db, sample_pipeline, sample_lead):
    """Add a lead to the pipeline at the first stage."""
    first_stage = sample_pipeline.stages.order_by('order').first()
    return PipelineLead.objects.create(
        lead=sample_lead,
        pipeline=sample_pipeline,
        stage=first_stage,
    )


# =============================================================================
# MODEL TESTS
# =============================================================================
@pytest.mark.django_db
class TestPipelineModel:
    def test_create_pipeline(self, sample_pipeline):
        assert str(sample_pipeline) == 'Default Sales Pipeline'
        assert sample_pipeline.stages.count() == 5

    def test_stage_ordering(self, sample_pipeline):
        stages = list(sample_pipeline.stages.order_by('order').values_list('name', flat=True))
        assert stages == ['Prospecting', 'Qualification', 'Proposal', 'Closing', 'Lost']

    def test_pipeline_lead_entry(self, pipeline_lead_entry, sample_pipeline):
        assert pipeline_lead_entry.stage.name == 'Prospecting'
        assert pipeline_lead_entry.pipeline == sample_pipeline


# =============================================================================
# API TESTS
# =============================================================================
@pytest.mark.django_db
class TestPipelineAPI:
    def test_create_pipeline(self, authenticated_admin):
        url = reverse('pipeline-list')
        data = {'name': 'Enterprise Pipeline', 'description': 'For enterprise deals'}
        response = authenticated_admin.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED

    def test_list_pipelines(self, authenticated_agent, sample_pipeline):
        url = reverse('pipeline-list')
        response = authenticated_agent.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_get_board_view(self, authenticated_admin, sample_pipeline, pipeline_lead_entry):
        url = reverse('pipeline-board', kwargs={'pk': sample_pipeline.pk})
        response = authenticated_admin.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'board' in response.data
        assert len(response.data['board']) == 5  # 5 stages

    def test_move_lead_between_stages(
        self, authenticated_admin, sample_pipeline, pipeline_lead_entry
    ):
        """Simulate drag-and-drop: move lead from Prospecting to Qualification."""
        target_stage = PipelineStage.objects.get(
            pipeline=sample_pipeline, name='Qualification'
        )
        url = reverse('pipeline-lead-move', kwargs={'pk': pipeline_lead_entry.pk})
        data = {'stage_id': str(target_stage.pk), 'notes': 'Lead qualified after call'}
        response = authenticated_admin.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        pipeline_lead_entry.refresh_from_db()
        assert pipeline_lead_entry.stage == target_stage

    def test_move_lead_to_same_stage_fails(
        self, authenticated_admin, pipeline_lead_entry
    ):
        """Moving a lead to its current stage should return an error."""
        url = reverse('pipeline-lead-move', kwargs={'pk': pipeline_lead_entry.pk})
        data = {'stage_id': str(pipeline_lead_entry.stage.pk)}
        response = authenticated_admin.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_move_to_win_stage_updates_lead_status(
        self, authenticated_admin, sample_pipeline, pipeline_lead_entry
    ):
        """Moving to a win stage should update lead status to 'converted'."""
        win_stage = PipelineStage.objects.get(
            pipeline=sample_pipeline, is_win_stage=True
        )
        url = reverse('pipeline-lead-move', kwargs={'pk': pipeline_lead_entry.pk})
        data = {'stage_id': str(win_stage.pk)}
        response = authenticated_admin.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        pipeline_lead_entry.lead.refresh_from_db()
        assert pipeline_lead_entry.lead.status == 'converted'

    def test_transition_history(
        self, authenticated_admin, sample_pipeline, pipeline_lead_entry
    ):
        """Moving a lead should create a transition log entry."""
        target_stage = PipelineStage.objects.get(
            pipeline=sample_pipeline, name='Qualification'
        )
        # Move the lead
        move_url = reverse('pipeline-lead-move', kwargs={'pk': pipeline_lead_entry.pk})
        authenticated_admin.post(
            move_url, {'stage_id': str(target_stage.pk)}, format='json'
        )
        # Get history
        history_url = reverse('pipeline-lead-history', kwargs={'pk': pipeline_lead_entry.pk})
        response = authenticated_admin.get(history_url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['to_stage_name'] == 'Qualification'


# =============================================================================
# RBAC TESTS
# =============================================================================
@pytest.mark.django_db
class TestPipelineRBAC:
    def test_agent_cannot_create_pipeline(self, authenticated_agent):
        url = reverse('pipeline-list')
        data = {'name': 'Agent Pipeline'}
        response = authenticated_agent.post(url, data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_agent_can_view_pipelines(self, authenticated_agent, sample_pipeline):
        url = reverse('pipeline-list')
        response = authenticated_agent.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_agent_cannot_delete_pipeline(self, authenticated_agent, sample_pipeline):
        url = reverse('pipeline-detail', kwargs={'pk': sample_pipeline.pk})
        response = authenticated_agent.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
