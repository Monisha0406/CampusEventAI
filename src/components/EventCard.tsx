import React from 'react';
import { Calendar, MapPin, Users, Heart, Sparkles } from 'lucide-react';
import { Event } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface EventCardProps {
  event: Event;
  isFavorited: boolean;
  isRegistered: boolean;
  onViewDetails: () => void;
  onRegister: () => void;
  onToggleFavorite: () => void;
}

export default function EventCard({ event, isFavorited, isRegistered, onViewDetails, onRegister, onToggleFavorite }: EventCardProps) {
  const seatsLeft = event.available_seats;
  const isSoldOut = seatsLeft <= 0;
  const isLowSeats = seatsLeft > 0 && seatsLeft <= 10;

  return (
    <div 
      id={`event-card-${event.id}`} 
      className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition duration-300 flex flex-col group relative"
    >
      {/* Favorite Button (floating overlay) */}
      <button
        id={`fav-btn-${event.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`absolute top-3 right-3 z-10 p-2.5 rounded-full backdrop-blur-md shadow-xs transition duration-200 active:scale-95 ${
          isFavorited
            ? 'bg-red-50 dark:bg-red-950/80 text-red-500'
            : 'bg-black/30 text-white hover:bg-black/50'
        }`}
        title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
      >
        <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
      </button>

      {/* Category Tag (floating overlay) */}
      <span 
        id={`category-tag-${event.id}`}
        className={`absolute top-3 left-3 z-10 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md shadow-sm backdrop-blur-md ${
          event.category === 'Technical'
            ? 'bg-blue-600/90 text-white'
            : 'bg-emerald-600/90 text-white'
        }`}
      >
        {event.category}
      </span>

      {/* Image Container with Zoom effect on hover */}
      <div 
        onClick={onViewDetails} 
        className="relative h-48 w-full overflow-hidden bg-gray-100 cursor-pointer"
        id={`img-container-${event.id}`}
      >
        <img
          src={event.image_url}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex-1 flex flex-col" id={`card-content-${event.id}`}>
        <div className="flex items-start justify-between mb-2">
          <h3 
            onClick={onViewDetails}
            className="font-display font-bold text-lg text-gray-900 dark:text-white leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            {event.title}
          </h3>
        </div>

        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed flex-1">
          {event.description}
        </p>

        {/* Info Grid */}
        <div className="space-y-2 mb-4 text-xs font-medium text-gray-700 dark:text-slate-300" id={`info-grid-${event.id}`}>
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>{formatDate(event.event_date)} at {event.event_time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            {isSoldOut ? (
              <span className="text-red-500 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">Sold Out</span>
            ) : isLowSeats ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded animate-pulse">
                Only {seatsLeft} seat{seatsLeft > 1 ? 's' : ''} left!
              </span>
            ) : (
              <span className="text-gray-600 dark:text-slate-400 font-medium">
                {seatsLeft} / {event.capacity} seats left
              </span>
            )}
          </div>
        </div>

        {/* Footer Area: Fee + Actions */}
        <div className="pt-4 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Reg Fee</span>
            <span className={`text-base font-extrabold ${event.fee === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
              {formatCurrency(event.fee)}
            </span>
          </div>

          <div className="flex space-x-2">
            <button
              id={`details-btn-${event.id}`}
              onClick={onViewDetails}
              className="px-3.5 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition border border-gray-200 dark:border-slate-600 active:scale-95 cursor-pointer"
            >
              Details
            </button>
            {isRegistered ? (
              <button
                id={`registered-badge-${event.id}`}
                disabled
                className="px-3.5 py-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl cursor-not-allowed border border-emerald-100 dark:border-emerald-900 flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Registered</span>
              </button>
            ) : (
              <button
                id={`reg-btn-${event.id}`}
                onClick={onRegister}
                disabled={isSoldOut}
                className={`px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition active:scale-95 cursor-pointer ${
                  isSoldOut
                    ? 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed text-gray-400'
                    : 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/15'
                }`}
              >
                {isSoldOut ? 'Full' : 'Register'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
