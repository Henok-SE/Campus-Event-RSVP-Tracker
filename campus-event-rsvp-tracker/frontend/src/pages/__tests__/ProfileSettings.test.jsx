import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileSettings from '../ProfileSettings';
import { useAuth } from '../../context/AuthContext';

const mockUpdateProfile = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('ProfileSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      user: {
        name: 'Current User',
        student_id: '1234/18',
        email: 'current@campusvibe.edu',
        interest_categories: ['Academic'],
        interest_keywords: ['mentorship']
      },
      updateProfile: mockUpdateProfile
    });
  });

  it('submits updated profile fields and shows success feedback', async () => {
    mockUpdateProfile.mockResolvedValue({
      name: 'Updated User',
      email: 'updated@campusvibe.edu'
    });

    render(<ProfileSettings />);

    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');

    fireEvent.change(nameInput, { target: { value: 'Updated User' } });
    fireEvent.change(emailInput, { target: { value: 'updated@campusvibe.edu' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        name: 'Updated User',
        email: 'updated@campusvibe.edu',
        interest_categories: ['Academic'],
        interest_keywords: ['mentorship']
      });
    });

    expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
  });

  it('shows an error message when profile update fails', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Unable to update profile'));

    render(<ProfileSettings />);
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/unable to update profile/i)).toBeInTheDocument();
    });
  });
});
