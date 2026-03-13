import React from 'react';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
          alt="Campus background with students" 
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        {/* Live Badge */}
        <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
          <span className="text-sm text-blue-700 font-medium">🎉 Spring 2026 events are live</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
          Discover Campus{' '}
          <span className="text-blue-600">Events Easily</span>
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Find, join, and create unforgettable campus events — from hackathons to open mics, 
          all in one place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
            Explore Events
            <ArrowRight className="h-5 w-5" />
          </button>
          <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition">
            Host an Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;