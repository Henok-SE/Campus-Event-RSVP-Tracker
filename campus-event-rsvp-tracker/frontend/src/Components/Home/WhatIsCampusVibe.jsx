import React from 'react';

const WhatIsCampusVibe = () => {
  const features = [
    {
      title: "Instant Discovery",
      description: "Events are auto-tagged and sorted so you never miss what matters to you."
    },
    {
      title: "Community First",
      description: "See who's going, invite your crew, and build real connections beyond the classroom."
    },
    {
      title: "Open to Every Campus",
      description: "Whether your school has 500 or 50,000 students, CampusVibe scales to fit."
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            WHAT IS CAMPUSVIBE?
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            The heartbeat of your campus
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl">
            CampusVibe is a student-powered platform that brings every campus event into one beautiful feed. 
            Whether you're looking for study groups, music nights, or hackathons — we make it effortless to 
            discover what's happening and connect with the people who share your interests.
          </p>
          <p className="text-lg text-gray-600 mt-4 max-w-3xl">
            Built by students, for students. No flyers. No group-chat spam. Just a clean, curated experience 
            that puts you in the center of campus life.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div key={index}>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatIsCampusVibe;