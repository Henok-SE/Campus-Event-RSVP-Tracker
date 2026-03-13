import React from 'react';
import { MapPin, Clock, Users } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const EventCard = ({ event }) => {
  const { title, description, location, category, attendees, capacity, startTime, foodCount } = event;
  
  const getCategoryVariant = (cat) => {
    const map = {
      'Tech': 'tech',
      'Music': 'music',
      'Sports': 'sports',
      'Food': 'food'
    };
    return map[cat] || 'default';
  };
  
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/50 transition group">
      <div className="flex justify-between items-start mb-4">
        <Badge variant={getCategoryVariant(category)}>{category}</Badge>
        {foodCount > 0 && (
          <Badge variant="food">{foodCount} Food</Badge>
        )}
      </div>
      
      <h3 className="text-xl font-semibold mb-2 group-hover:text-purple-400 transition">
        {title}
      </h3>
      
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {description}
      </p>
      
      <div className="space-y-2 mb-4 text-sm text-gray-500">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          {location}
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          {startTime}
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          {attendees}/{capacity} attending
        </div>
      </div>
      
      <Button variant="outline" className="w-full">
        Count Me In
      </Button>
    </div>
  );
};

export default EventCard;