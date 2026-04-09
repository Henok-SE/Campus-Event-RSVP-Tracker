import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../Login';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ search: '' })
  };
});

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      isAuthLoading: false,
      isLoggedIn: false,
      login: mockLogin,
      register: mockRegister
    });
  });

  it('submits full registration payload including interests', async () => {
    mockRegister.mockResolvedValue({ success: true });

    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    fireEvent.change(document.querySelector('input[name="name"]'), { target: { value: '  New Student  ' } });
    fireEvent.change(document.querySelector('input[name="email"]'), { target: { value: 'NEW.STUDENT@EXAMPLE.COM' } });
    fireEvent.change(document.querySelector('input[name="student_id"]'), { target: { value: '4321/20' } });
    fireEvent.change(document.querySelector('input[name="password"]'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByLabelText('Tech'));
    fireEvent.change(document.querySelector('input[name="interest_keywords"]'), { target: { value: 'Robotics, AI' } });

    const submitButton = screen
      .getAllByRole('button', { name: 'Create Account' })
      .find((button) => button.getAttribute('type') === 'submit');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'New Student',
        email: 'new.student@example.com',
        student_id: '4321/20',
        password: 'Password123!',
        interest_categories: ['Tech'],
        interest_keywords: ['robotics', 'ai']
      });
    });
  });

  it('blocks registration when no interests are selected', async () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    fireEvent.change(document.querySelector('input[name="name"]'), { target: { value: 'New Student' } });
    fireEvent.change(document.querySelector('input[name="email"]'), { target: { value: 'new.student@example.com' } });
    fireEvent.change(document.querySelector('input[name="student_id"]'), { target: { value: '4321/20' } });
    fireEvent.change(document.querySelector('input[name="password"]'), { target: { value: 'Password123!' } });

    const submitButton = screen
      .getAllByRole('button', { name: 'Create Account' })
      .find((button) => button.getAttribute('type') === 'submit');

    fireEvent.click(submitButton);

    expect(mockRegister).not.toHaveBeenCalled();
    expect(screen.getByText('Select at least one interest category or add a custom interest')).toBeInTheDocument();
  });
});
