import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';

// Mocking dependencies
const mocks = vi.hoisted(() => {
  const getDashboardStats = vi.fn();
  const getLeads = vi.fn();
  const user = {
    role: 'admin',
    full_name: 'Admin User',
  };
  return {
    getDashboardStats,
    getLeads,
    user
  };
});

vi.mock('../../services/api', () => ({
  analyticsAPI: {
    getDashboardStats: mocks.getDashboardStats,
  },
  leadsAPI: {
    getLeads: mocks.getLeads,
  },
}));

vi.mock('../../store/store', () => ({
  useAuthStore: () => ({
    user: mocks.user,
  }),
}));

// Mock Recharts
vi.mock('recharts', () => {
  const OriginalRecharts = vi.importActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }) => <div style={{ width: '100%', height: '100%' }}>{children}</div>,
    BarChart: ({ children }) => <div>{children}</div>,
    Bar: () => <div>Bar</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    CartesianGrid: () => <div>Grid</div>,
    Tooltip: () => <div>Tooltip</div>,
    Legend: () => <div>Legend</div>,
    PieChart: ({ children }) => <div>{children}</div>,
    Pie: () => <div>Pie</div>,
    Cell: () => <div>Cell</div>,
  };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('Dashboard Component', () => {
  const adminStats = {
    data: {
      overview: {
        total_leads: 150,
        active_deals: 45,
        conversion_rate: 12.5,
        total_revenue: 75000,
      },
      leads_by_status: [{ status: 'new', count: 50 }],
      leads_by_source: [{ source: 'website', count: 80 }],
      leads_by_priority: [{ priority: 'high', count: 20 }],
    },
  };

  const agentLeads = {
    data: {
      results: [
        { id: 1, status: 'new', priority: 'high', source: 'website', deal_value: 1000 },
        { id: 2, status: 'converted', priority: 'medium', source: 'referral', deal_value: 5000 },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders admin dashboard with correct stats', async () => {
    mocks.user.role = 'admin';
    mocks.getDashboardStats.mockResolvedValue(adminStats);

    render(<Dashboard />);

    await waitFor(() => {
      // Check for values from adminStats
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('75,000')).toBeInTheDocument();
    });

    expect(mocks.getDashboardStats).toHaveBeenCalled();
  });

  it('renders agent dashboard based on lead list', async () => {
    // Note: Reassigning the mock object property instead of reassigning 'mocks.user'
    // to ensure the closure in vi.mock picking up the change.
    mocks.user.role = 'agent';
    mocks.getLeads.mockResolvedValue(agentLeads);

    render(<Dashboard />);

    await waitFor(() => {
      // 2 leads in agentLeads
      expect(screen.getByText('2')).toBeInTheDocument();
      // 1 converted lead with 5000 deal value
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });

    expect(mocks.getLeads).toHaveBeenCalled();
  });

  it('displays user role access correctly', async () => {
    mocks.user.role = 'manager';
    mocks.getDashboardStats.mockResolvedValue(adminStats);

    render(<Dashboard />);

    await waitFor(() => {
      // Check for manager Access text
      const accessBadge = screen.getByText(/manager Access/i);
      expect(accessBadge).toBeInTheDocument();
    });
  });
});
