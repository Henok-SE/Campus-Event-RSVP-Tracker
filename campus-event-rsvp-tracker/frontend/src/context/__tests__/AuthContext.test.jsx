import { act } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../AuthContext';
import * as api from '../../services/api';

let unauthorizedCallback;

vi.mock('../../services/api', () => ({
  clearAuthToken: vi.fn(),
  getApiError: vi.fn((error, fallbackMessage = 'Request failed') => ({
    code: error?.response?.data?.error?.code || 'REQUEST_FAILED',
    message: error?.response?.data?.error?.message || fallbackMessage
  })),
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
  registerUnauthorizedHandler: vi.fn((handler) => {
    unauthorizedCallback = handler;
    return vi.fn();
  }),
  registerUser: vi.fn(),
  setAuthToken: vi.fn(),
  updateCurrentUser: vi.fn()
}));

function AuthProbe() {
  const { isLoggedIn, register } = useAuth();

  return (
    <div>
      <p data-testid="auth-state">{isLoggedIn ? 'logged-in' : 'logged-out'}</p>
      <button
        type="button"
        data-testid="register-trigger"
        onClick={() => register({
          name: 'New User',
          email: 'new.user@campusvibe.edu',
          student_id: '4321/20',
          password: 'Password123!',
          interest_categories: ['Tech'],
          interest_keywords: ['robotics']
        })}
      >
        register
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    unauthorizedCallback = undefined;
    vi.clearAllMocks();
    localStorage.clear();

    api.getCurrentUser.mockResolvedValue({
      data: {
        data: {
          name: 'Test User',
          email: 'test@campusvibe.edu',
          student_id: '1234/18',
          role: 'student',
          interest_categories: ['Academic'],
          interest_keywords: ['debate']
        }
      }
    });
  });

  it('resets auth state when a global 401 event is received', async () => {
    localStorage.setItem('campusvibe_token', 'test-token');
    localStorage.setItem(
      'campusvibe_user',
      JSON.stringify({
        name: 'Test User',
        email: 'test@campusvibe.edu',
        student_id: '1234/18',
        role: 'student',
        interest_categories: ['Academic'],
        interest_keywords: ['debate']
      })
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('logged-in');
    });

    await act(async () => {
      unauthorizedCallback?.({ response: { status: 401 } });
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('logged-out');
    });

    expect(api.registerUnauthorizedHandler).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('campusvibe_token')).toBeNull();
    expect(localStorage.getItem('campusvibe_user')).toBeNull();
  });

  it('forwards extended registration payload to API', async () => {
    api.registerUser.mockResolvedValue({ data: { success: true } });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId('register-trigger'));

    await waitFor(() => {
      expect(api.registerUser).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new.user@campusvibe.edu',
        student_id: '4321/20',
        password: 'Password123!',
        interest_categories: ['Tech'],
        interest_keywords: ['robotics']
      });
    });
  });
});
