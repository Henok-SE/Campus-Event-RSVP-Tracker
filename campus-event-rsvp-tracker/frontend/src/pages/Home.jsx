import React from 'react';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import WhatIsCampusVibe from '../components/home/WhatIsCampusVibe';
import WhyCampusVibe from '../components/home/WhyCampusVibe';
import HowItWorks from '../components/home/HowItWorks';
import UpcomingEvents from '../components/home/UpcomingEvents';
import CTA from '../components/home/CTA';
import Footer from '../components/layout/Footer';

const HomePage = () => {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <WhatIsCampusVibe />
      <WhyCampusVibe />
      <HowItWorks />
      <UpcomingEvents />
      <CTA />
      <Footer />
    </div>
  );
};

export default HomePage;