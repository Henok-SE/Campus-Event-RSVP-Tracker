import React from 'react';

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Browse",
      description: "Explore events by category, date, or popularity. Filter to find exactly what excites you."
    },
    {
      number: "02",
      title: "RSVP",
      description: "One tap to save your spot. Invite friends and get reminders so you never miss out."
    },
    {
      number: "03",
      title: "Show Up & Enjoy",
      description: "Arrive, connect, and make memories. Rate events to help others discover great experiences."
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
            SIMPLE & EASY
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            How it works
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="text-6xl font-bold text-blue-600 mb-4">{step.number}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;