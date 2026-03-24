// src/pages/ProfileSettings.jsx
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function ProfileSettings() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    student_id: user?.student_id || '',
    email: user?.email || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    alert("Profile updated! (mock save)");
    // In real app → call API to update user
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-10">
        <h1 className="text-3xl font-semibold mb-8">Profile Settings</h1>

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
              onChange={handleChange}
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}