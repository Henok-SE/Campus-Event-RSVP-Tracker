import React from 'react';
import { Zap, Users, Globe } from 'lucide-react';
import SectionTitle from '../ui/SectionTitle';

const features = [
  {
    icon: <Zap className="h-8 w-8 text-purple-500" />,
    title: 'Instant Discovery',
    description: 'Events are auto-tagged and sorted so you never miss what matters to you.'
  },
  {
    icon: <Users className="h-8 w-8 text-purple-500" />,
    title: 'Community First',
    description: "See who's going, invite your crew, and build real connections beyond the classroom."
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: 'Open to Every Campus',
    description: 'Whether your school has 500 or 50,000 students, CampusVibe scales to fit.'
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle 
          title="The heartbeat of your campus"
          subtitle="Built by students, for students. No flyers. No group-chat spam. Just a clean, curated experience."
        />
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition group"
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;