import React from 'react';

const WhyCampusVibe = () => {
  const features = [
    {
      title: "Find Events",
      description: "Browse a curated feed of campus happenings — filtered by date, category, or your interests."
    },
    {
      title: "Join Events",
      description: "RSVP instantly, invite friends, and see who's going. Campus life is better when shared."
    },
    {
      title: "Create Events",
      description: "Launch and promote your event in minutes. We handle the logistics so you can focus on the fun."
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            WHY CAMPUSVIBE?
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything you need for campus life
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div key={index}>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyCampusVibe;