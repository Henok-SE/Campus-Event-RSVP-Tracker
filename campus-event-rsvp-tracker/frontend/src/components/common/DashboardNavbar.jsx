// src/components/common/DashboardNavbar.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bell, Menu, Plus, Shield, Sparkles, X } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export default function DashboardNavbar({ rsvpCount = 0 }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [mobileMenuPath, setMobileMenuPath] = useState(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const isMobileMenuOpen = mobileMenuPath === location.pathname;

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuPath(null);
      }
    };

    const handleOutsidePress = (event) => {
      const targetNode = event.target;

      if (mobileMenuRef.current?.contains(targetNode) || mobileMenuButtonRef.current?.contains(targetNode)) {
        return;
      }

      setMobileMenuPath(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsidePress);
    document.addEventListener('touchstart', handleOutsidePress);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsidePress);
      document.removeEventListener('touchstart', handleOutsidePress);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuPath(null);
  };

  const openNotifications = () => {
    closeMobileMenu();
    navigate('/notifications');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-600" aria-hidden="true" />
          <span className="hidden sm:inline text-xl sm:text-2xl font-semibold tracking-tight">CampusVibe</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 md:gap-7">
          <div className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 sm:text-sm">
            {rsvpCount} RSVP'd
          </div>

          <div className="hidden sm:flex items-center gap-3 sm:gap-4 md:gap-7">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={openNotifications}
                aria-label="Open notifications"
                className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white hover:text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"
              >
                <Bell className="h-5 w-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <Link
              to="/create-event"
              aria-label="Create event"
              title="Create event"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </Link>

            {user?.role === 'Admin' ? (
              <Link
                to="/admin"
                aria-label="Open admin control center"
                title="Admin control center"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-slate-700 text-white transition-all duration-200 hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5"
              >
                <Shield className="h-5 w-5" aria-hidden="true" />
              </Link>
            ) : null}

            <button
              onClick={() => navigate('/profile')}
              aria-label="Open profile"
              className="w-10 h-10 cursor-pointer bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {user?.name?.charAt(0) || 'H'}
            </button>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => navigate('/profile')}
              aria-label="Open profile"
              className="w-10 h-10 cursor-pointer bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {user?.name?.charAt(0) || 'H'}
            </button>

            <button
              ref={mobileMenuButtonRef}
              type="button"
              aria-label="Open quick actions menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-dashboard-actions"
              onClick={() => {
                setMobileMenuPath((prev) => (prev === location.pathname ? null : location.pathname));
              }}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div
            id="mobile-dashboard-actions"
            ref={mobileMenuRef}
            className="absolute right-4 top-[calc(100%+0.5rem)] z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg sm:hidden"
          >
            <button
              type="button"
              onClick={openNotifications}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Bell className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>Notifications</span>
              {unreadCount > 0 ? (
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </button>

            <Link
              to="/create-event"
              onClick={closeMobileMenu}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Plus className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span>Create event</span>
            </Link>

            {user?.role === 'Admin' ? (
              <Link
                to="/admin"
                onClick={closeMobileMenu}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Shield className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <span>Admin control center</span>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </nav>
  );
}