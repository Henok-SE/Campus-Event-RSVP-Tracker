import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Landing from './pages/Landing';
import About from './pages/About';
import Events from './pages/Events';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import MySchedule from './pages/MySchedule';
import CreateEvent from './pages/CreateEvent';
import AdminControlCenter from './pages/AdminControlCenter';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/events" element={<Events />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile-settings"
          element={(
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/notifications"
          element={(
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          )}
        />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route
          path="/my-schedule"
          element={(
            <ProtectedRoute>
              <MySchedule />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/create-event"
          element={(
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute requiredRole="Admin">
              <AdminControlCenter />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/review"
          element={(
            <ProtectedRoute requiredRole="Admin">
              <Navigate to="/admin" replace />
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
    </ToastProvider>
  );
}

export default App;