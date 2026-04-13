// src/pages/ProfileSettings.jsx
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { FIXED_INTEREST_CATEGORIES } from '../data/interestOptions';
import BackButton from '../components/ui/BackButton';

const parseCustomInterests = (value = '') => (
  [...new Set(
    value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  )]
);

export default function ProfileSettings() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    student_id: user?.student_id || '',
    email: user?.email || '',
    interest_categories: user?.interest_categories || [],
    interest_keywords: (user?.interest_keywords || []).join(', ')
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setErrorMessage('');
    setSuccessMessage('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInterestCategoryToggle = (category) => {
    setErrorMessage('');
    setSuccessMessage('');

    setFormData((prev) => {
      const isSelected = prev.interest_categories.includes(category);
      return {
        ...prev,
        interest_categories: isSelected
          ? prev.interest_categories.filter((entry) => entry !== category)
          : [...prev.interest_categories, category]
      };
    });
  };

  const handleSave = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const normalizedCustomInterests = parseCustomInterests(formData.interest_keywords);
    if (formData.interest_categories.length + normalizedCustomInterests.length === 0) {
      setErrorMessage('Select at least one interest category or add a custom interest.');
      setLoading(false);
      return;
    }

    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        interest_categories: formData.interest_categories,
        interest_keywords: normalizedCustomInterests
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
        <BackButton to="/dashboard" label="Back to Dashboard" className="mb-6" />
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
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl transition-colors focus:outline-none focus:border-blue-600"
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
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl transition-colors focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Interest Categories</label>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 p-4">
              {FIXED_INTEREST_CATEGORIES.map((category) => {
                const isSelected = formData.interest_categories.includes(category);

                return (
                  <label
                    key={category}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                        : 'bg-slate-50 text-slate-700 border border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleInterestCategoryToggle(category)}
                      className="h-4 w-4 cursor-pointer accent-blue-600"
                    />
                    <span>{category}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Custom Interests</label>
            <input
              type="text"
              name="interest_keywords"
              value={formData.interest_keywords}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl transition-colors focus:outline-none focus:border-blue-600"
              placeholder="robotics, startups, volunteering"
            />
            <p className="mt-2 text-xs text-slate-500">Separate multiple custom interests with commas.</p>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 disabled:bg-blue-400 text-white py-5 rounded-2xl font-semibold transition-all duration-200"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}