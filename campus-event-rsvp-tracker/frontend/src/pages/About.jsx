import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="bg-white min-h-screen">
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="uppercase text-blue-600 font-semibold tracking-widest text-sm mb-3">WHAT IS CAMPUSVIBE?</p>
            <h2 className="text-5xl font-bold leading-tight mb-8">The heartbeat of your campus</h2>
            <p className="text-lg text-slate-600 mb-6">
              CampusVibe is a student-powered platform that brings every campus event into one beautiful feed. We believe that discovering what's happening around you should be effortless, organized, and social.
            </p>
            <p className="text-lg text-slate-600 mb-8">
              Whether you are looking to host a 500-person hackathon, a quiet study group, or just want to see what your friends are up to this weekend, CampusVibe is your central hub for all things campus life.
            </p>
            <Link 
              to="/login" 
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-md"
            >
              Join the Community
            </Link>
          </div>

          <div className="space-y-6">
            {[
              { icon: "⚡", title: "Instant Discovery", desc: "Events are auto-tagged and sorted so you never miss what matters to you." },
              { icon: "❤️", title: "Community First", desc: "See who’s going, invite your crew, and build real connections." },
              { icon: "🌍", title: "Open to Every Campus", desc: "Whether your school has 500 or 50,000 students, it fits perfectly." }
            ].map((item, i) => (
              <div key={i} className="flex gap-6 bg-slate-50 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="text-5xl">{item.icon}</div>
                <div>
                  <h3 className="font-semibold text-2xl mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
