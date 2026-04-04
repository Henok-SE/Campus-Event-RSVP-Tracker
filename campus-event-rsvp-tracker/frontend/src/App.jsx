import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Landing from './pages/Landing';
import Events from './pages/Events';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import ProfileSettings from './pages/ProfileSettings';
import MySchedule from './pages/MySchedule';
import CreateEvent from './pages/CreateEvent';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
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
        {/* <Route path="/event/:id" element={<EventDetails />} /> */}
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
      </Routes>
    </Router>
  );
}

export default App;