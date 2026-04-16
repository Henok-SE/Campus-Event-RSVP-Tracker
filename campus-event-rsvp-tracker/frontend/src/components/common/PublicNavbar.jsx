import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  
  const isHome = location.pathname === '/';
  const isTransparent = isHome && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navBaseClass = isHome ? 'fixed w-full' : 'sticky w-full';
  const navBgClass = isTransparent 
    ? 'bg-transparent text-white border-transparent' 
    : 'bg-white text-slate-900 border-b border-slate-200 shadow-sm';

  return (
    <nav className={`${navBaseClass} top-0 z-50 transition-all duration-300 ${navBgClass}`}>
      <div className={`max-w-7xl mx-auto px-6 py-5 flex items-center justify-between relative z-20 ${isTransparent ? 'bg-transparent' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
            <Sparkles className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">CampusVibe</span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/" className={`hover:text-blue-500 transition-colors ${isTransparent ? 'text-white' : 'text-slate-700'}`}>Home</Link>
          <Link to="/events" className={`hover:text-blue-500 transition-colors ${isTransparent ? 'text-white' : 'text-slate-700'}`}>Events</Link>
          <Link to="/about" className={`hover:text-blue-500 transition-colors ${isTransparent ? 'text-white' : 'text-slate-700'}`}>About</Link>
          <Link 
            to="/login" 
            className={`px-8 py-3 rounded-2xl font-semibold transition-all ${
              isTransparent 
                ? 'bg-white text-blue-600 hover:bg-slate-100' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Login
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className={`md:hidden p-2 transition-colors ${isTransparent ? 'text-white hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`} 
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close mobile menu"
            className="md:hidden fixed inset-0 z-10 bg-black/35"
            onClick={() => setIsOpen(false)}
          />

          <div className="md:hidden absolute top-full left-0 w-full z-20 px-4 pt-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className={`block rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-slate-100 text-blue-700'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-blue-700'
                }`}
              >
                Home
              </Link>
              <Link
                to="/events"
                onClick={() => setIsOpen(false)}
                className={`block rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                  location.pathname === '/events'
                    ? 'bg-slate-100 text-blue-700'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-blue-700'
                }`}
              >
                Events
              </Link>
              <Link
                to="/about"
                onClick={() => setIsOpen(false)}
                className={`block rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                  location.pathname === '/about'
                    ? 'bg-slate-100 text-blue-700'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-blue-700'
                }`}
              >
                About
              </Link>

              <div className="my-2 h-px bg-slate-200" />

              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="mt-2 block rounded-xl bg-blue-600 px-8 py-3.5 text-center font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}