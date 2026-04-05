import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

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
          <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">cv</div>
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
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b shadow-xl px-6 py-6 flex flex-col gap-5 z-10 animate-in slide-in-from-top-2">
          <Link to="/" onClick={() => setIsOpen(false)} className="text-lg font-medium hover:text-blue-600">Home</Link>
          <Link to="/events" onClick={() => setIsOpen(false)} className="text-lg font-medium hover:text-blue-600">Events</Link>
          <Link to="/about" onClick={() => setIsOpen(false)} className="text-lg font-medium hover:text-blue-600">About</Link>
          <Link 
            to="/login" 
            onClick={() => setIsOpen(false)}
            className="bg-blue-600 text-white text-center px-8 py-4 rounded-2xl font-semibold mt-2"
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
}