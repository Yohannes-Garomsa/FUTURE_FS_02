import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { authAPI, usersAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Mocking dependencies
const mocks = vi.hoisted(() => {
  const login = vi.fn();
  const setToken = vi.fn();
  const getMe = vi.fn();
  const authLogin = vi.fn();
  const toastSuccess = vi.fn();
  const toastError = vi.fn();
  
  const mockUseAuthStore = vi.fn(() => ({
    login: login,
  }));
  mockUseAuthStore.getState = vi.fn(() => ({
    setToken: setToken,
  }));

  return {
    login,
    setToken,
    getMe,
    authLogin,
    toastSuccess,
    toastError,
    mockUseAuthStore
  };
});

vi.mock('../../services/api', () => ({
  authAPI: {
    login: mocks.authLogin,
  },
  usersAPI: {
    getMe: mocks.getMe,
  },
}));

vi.mock('../../store/store', () => ({
  useAuthStore: mocks.mockUseAuthStore,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText(/Strategic Entry/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/executive@company.ai/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Execute Entry/i })).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText(/executive@company.ai/i);
    fireEvent.change(emailInput, { target: { name: 'email', value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  it('shows error toast on login failure', async () => {
    authAPI.login.mockRejectedValueOnce({
      response: { data: { detail: 'Invalid credentials' } },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/executive@company.ai/i), {
      target: { name: 'email', value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { name: 'password', value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Execute Entry/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });
});
