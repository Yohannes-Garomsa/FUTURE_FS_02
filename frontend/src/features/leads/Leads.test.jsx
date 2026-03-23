import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Leads from './Leads';

const mocks = vi.hoisted(() => ({
  getLeads: vi.fn(),
  deleteLead: vi.fn(),
  user: {
    role: 'admin',
    full_name: 'Admin User',
  },
  useQuery: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  leadsAPI: {
    getLeads: mocks.getLeads,
    deleteLead: mocks.deleteLead,
  },
}));

vi.mock('../../store/store', () => ({
  useAuthStore: () => ({
    user: mocks.user,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: mocks.useQuery,
}));

const renderWithProviders = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('Leads Component', () => {
  const sampleLeads = {
    data: {
      results: [
        { id: 1, full_name: 'John Doe', email: 'john@example.com', company: 'Acme Corp', status: 'new' },
        { id: 2, full_name: 'Jane Smith', email: 'jane@example.com', company: 'Global Inc', status: 'contacted' },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useQuery.mockReturnValue({
      data: sampleLeads,
      isLoading: false,
      refetch: vi.fn(),
    });
  });

  it('renders the leads table with data', async () => {
    renderWithProviders(<Leads />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('filters leads based on search input', async () => {
    renderWithProviders(<Leads />);

    await waitFor(() => screen.getByText('John Doe'));

    const searchInput = screen.getByPlaceholderText(/Search leads.../i);
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('hides Add Lead button for regular agents', async () => {
    mocks.user.role = 'agent';
    renderWithProviders(<Leads />);

    await waitFor(() => screen.getByText('John Doe'));
    expect(screen.queryByText(/Add Lead/i)).not.toBeInTheDocument();
  });

  it('shows Add Lead button for admins', async () => {
    mocks.user.role = 'admin';
    renderWithProviders(<Leads />);

    await waitFor(() => screen.getByText('John Doe'));
    expect(screen.getByText(/Add Lead/i)).toBeInTheDocument();
  });

  it('calls deleteLead when delete button is clicked and confirmed', async () => {
    mocks.user.role = 'admin';
    vi.stubGlobal('confirm', vi.fn(() => true));
    
    renderWithProviders(<Leads />);

    await waitFor(() => screen.getByText('John Doe'));

    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('text-red-600')
    );
    
    // There are 2 trash icons, one for each lead in sampleLeads
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this lead?');
    expect(mocks.deleteLead).toHaveBeenCalledWith(1);
  });
});
