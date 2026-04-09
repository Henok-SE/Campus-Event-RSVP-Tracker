import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Landing from './pages/Landing';
import About from './pages/About';
import Events from './pages/Events';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import ProfileSettings from './pages/ProfileSettings';
import MySchedule from './pages/MySchedule';
import CreateEvent from './pages/CreateEvent';
import AdminEventReview from './pages/AdminEventReview';
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
          path="/profile-settings"
          element={(
            <ProtectedRoute>
              <ProfileSettings />
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
          path="/admin/review"
          element={(
            <ProtectedRoute requiredRole="Admin">
              <AdminEventReview />
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