import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Ready to vibe with your campus?
        </h2>
        <p className="text-xl text-gray-600 mb-10">
          Join thousands of students who are already discovering and creating unforgettable campus moments.
        </p>
        <Link 
          to="/signup" 
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition"
        >
          Get Started Free
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
};

export default CTA;