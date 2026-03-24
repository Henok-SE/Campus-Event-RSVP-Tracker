// src/pages/Login.jsx
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = () => {
    // Store all data based on your database schema
    const newUser = {
      name: formData.name,
      student_id: formData.student_id,
      email: formData.email,
      role: "Student"   // default role
    };

    login(formData.email, "Student", newUser);   // updated login function
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl">🎓</div>
        </div>
        
        <h1 className="text-center text-3xl font-semibold mb-2">CampusVibe</h1>
        <p className="text-center text-slate-500 mb-10">Discover &amp; RSVP to campus events</p>

        <h2 className="text-2xl font-semibold text-center mb-8">Create Account</h2>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-600" 
              placeholder="John Doe" 
            />
          </div>

          {/* Student ID */}
          <div>
            <label className="block text-sm font-medium mb-2">Student ID</label>
            <input 
              type="text" 
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-600" 
              placeholder="U123456" 
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2"> Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-600" 
              placeholder="you@example.com" 
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-600" 
              placeholder="••••••••" 
            />
          </div>
        </div>

        <button 
          onClick={handleSignUp}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-semibold text-lg transition-all"
        >
          Create Account
        </button>

        <p className="text-center mt-8 text-sm text-slate-600">
          Already have an account? <span className="text-blue-600 font-medium cursor-pointer">Sign in</span>
        </p>
      </div>
    </div>
  );
}