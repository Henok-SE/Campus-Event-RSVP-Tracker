// src/pages/Login.jsx
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const STUDENT_ID_PATTERN = /^\d{4}\/\d{2}$/;
const normalizeStudentId = (value = '') => value.trim().replace(/\s+/g, '');

export default function Login() {
  const { isAuthLoading, isLoggedIn, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const redirectTarget = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const candidate = params.get('redirect');
    return candidate && candidate.startsWith('/') ? candidate : '/dashboard';
  }, [location.search]);

  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (!isAuthLoading && isLoggedIn) {
      navigate(redirectTarget, { replace: true });
    }
  }, [isAuthLoading, isLoggedIn, navigate, redirectTarget]);

  const handleChange = (e) => {
    setErrorMessage('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedStudentId = normalizeStudentId(formData.student_id);

    if (!STUDENT_ID_PATTERN.test(normalizedStudentId)) {
      setErrorMessage('Student ID must use 1234/18 format');
      setSuccessMessage('');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (mode === 'register') {
        await register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          student_id: normalizedStudentId,
          password: formData.password
        });

        setSuccessMessage('Account created successfully. Please sign in.');
        setMode('login');
      } else {
        await login({
          student_id: normalizedStudentId,
          password: formData.password
        });

        navigate(redirectTarget, { replace: true });
      }
    } catch (error) {
      setErrorMessage(error?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl">🎓</div>
        </div>
        
        <h1 className="text-center text-3xl font-semibold mb-2">CampusVibe</h1>
        <p className="text-center text-slate-500 mb-10">Discover &amp; RSVP to campus events</p>

                <div className="flex gap-3 bg-slate-100 rounded-2xl p-1 mb-8">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      mode === 'login' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMessage('');
                    }}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      mode === 'register' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                    }`}
                    >
                    Create Account
                    </button>
                  </div>

                  <h2 className="text-2xl font-semibold text-center mb-8">
                    {mode === 'register' ? 'Create Account' : 'Welcome Back'}
                  </h2>

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

                  <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                    {mode === 'register' ? (
                    <>
                      <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-600"
                        placeholder="John Student"
                        required
                      />
                      </div>

                      <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-600"
                        placeholder="john.student@campus.edu"
                        required
                      />
                      </div>
                    </>
                    ) : null}

                    <div>
                    <label className="block text-sm font-medium mb-2">Student ID</label>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleChange}
                      className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-600"
                      placeholder="1234/18"
                      pattern="\d{4}/\d{2}"
                      title="Use 1234/18 format"
                      required
                    />
                    </div>

                    <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Password</label>
                      {mode === 'login' && (
                        <a
                          href="mailto:support@campusvibe.edu.et?subject=CampusVibe%20Password%20Reset%20Request"
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Forgot password?
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-5 py-4 border border-slate-300 rounded-2xl focus:outline-none focus:border-blue-600 pr-12"
                        placeholder="..."
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    </div>

                    <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-5 rounded-2xl font-semibold text-lg transition-all"
                    >
                    {loading
                      ? (mode === 'register' ? 'Creating Account...' : 'Signing In...')
                      : (mode === 'register' ? 'Create Account' : 'Sign In')}
                    </button>
                  </form>

                  <p className="text-center mt-8 text-sm text-slate-600">
                    {mode === 'register' ? 'Already have an account?' : 'Need an account?'}{' '}
                    <button
                    type="button"
                    onClick={() => {
                      setMode((prev) => (prev === 'register' ? 'login' : 'register'));
                      setErrorMessage('');
                    }}
                    className="text-blue-600 font-medium"
                  >
                    {mode === 'register' ? 'Sign in' : 'Create one'}
                  </button>
        </p>
      </div>
    </div>
  );
}