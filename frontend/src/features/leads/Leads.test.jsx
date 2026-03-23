import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Leads from './Leads';
import { leadsAPI } from '../../services/api';

const mocks = vi.hoisted(() => ({
  getLeads: vi.fn(),
  deleteLead: vi.fn(),
  user: {
    role: 'admin',
    full_name: 'Admin User',
  },
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
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
    mocks.getLeads.mockResolvedValue(sampleLeads);
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

    const deleteButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg.text-red-600') || btn.className.includes('text-red-600'));
    // Since we have 2 leads, there should be 2 delete buttons
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this lead?');
    expect(mocks.deleteLead).toHaveBeenCalledWith(1);
  });
});
