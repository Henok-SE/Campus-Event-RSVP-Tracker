// src/components/layout/MainLayout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import PublicNavbar from '../common/PublicNavbar';
import DashboardNavbar from '../common/DashboardNavbar';
import Footer from '../common/Footer';

export default function MainLayout() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen flex flex-col">
      {isDashboard ? <DashboardNavbar /> : <PublicNavbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}