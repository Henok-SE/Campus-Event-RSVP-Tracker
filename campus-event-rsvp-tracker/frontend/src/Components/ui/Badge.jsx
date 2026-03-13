import React from 'react';

const Badge = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-800 text-gray-300',
    tech: 'bg-blue-500/20 text-blue-400',
    music: 'bg-purple-500/20 text-purple-400',
    sports: 'bg-green-500/20 text-green-400',
    food: 'bg-orange-500/20 text-orange-400',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

export default Badge;