import React from 'react';

const SectionTitle = ({ title, subtitle, align = 'center' }) => {
  const alignmentClasses = {
    center: 'text-center',
    left: 'text-left',
    right: 'text-right'
  };
  
  return (
    <div className={`max-w-2xl mx-auto ${alignmentClasses[align]}`}>
      {subtitle && (
        <p className="text-purple-400 text-sm font-semibold uppercase tracking-wider mb-3">
          {subtitle}
        </p>
      )}
      <h2 className="text-3xl md:text-4xl font-bold">
        {title}
      </h2>
    </div>
  );
};

export default SectionTitle;