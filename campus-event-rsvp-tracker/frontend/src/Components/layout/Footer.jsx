import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-black text-white border-t border-gray-200 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1">
            <h3 className="text-2xl font-bold text-blue-600 mb-4">CampusVibe</h3>
            <p className="text-gray-600">
              The go-to platform for discovering and hosting campus events that matter.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/events" className="text-gray-600 hover:text-blue-600">Browse Events</Link></li>
              <li><Link to="/host" className="text-gray-600 hover:text-blue-600">Host an Event</Link></li>
              <li><Link to="/pricing" className="text-gray-600 hover:text-blue-600">Pricing</Link></li>
              <li><Link to="/faq" className="text-gray-600 hover:text-blue-600">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-600 hover:text-blue-600">About Us</Link></li>
              <li><Link to="/blog" className="text-gray-600 hover:text-blue-600">Blog</Link></li>
              <li><Link to="/careers" className="text-gray-600 hover:text-blue-600">Careers</Link></li>
              <li><Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-600 hover:text-blue-600">Terms of Service</Link></li>
              <li><Link to="/cookies" className="text-gray-600 hover:text-blue-600">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center text-gray-500">
          <p>© 2025 CampusVibe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;