// src/pages/ProfileSettings.jsx
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function ProfileSettings() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    student_id: user?.student_id || '',
    email: user?.email || ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setErrorMessage('');
    setSuccessMessage('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateProfile({
        name: formData.name,
        email: formData.email
      });

      setSuccessMessage('Profile updated successfully.');
    } catch (error) {
      setErrorMessage(error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-10">
        <h1 className="text-3xl font-semibold mb-8">Profile Settings</h1>

        {errorMessage ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Student ID</label>
            <input 
              type="text" 
              name="student_id"
              value={formData.student_id}
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl bg-slate-50 text-slate-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-5 rounded-2xl font-semibold"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}