import { X, Calendar, MapPin, Users, Phone, Award, ClipboardList, Clock } from 'lucide-react';
import { Event } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface EventDetailsModalProps {
  event: Event;
  isRegistered: boolean;
  onClose: () => void;
  onRegister: () => void;
}

export default function EventDetailsModal({ event, isRegistered, onClose, onRegister }: EventDetailsModalProps) {
  const rulesList = event.rules ? event.rules.split('.').map(r => r.trim()).filter(Boolean) : [];

  // Coordinates mapping depending on venues for Google Maps Iframe placeholder
  // To avoid actual complex live API dependencies, we'll embed a standard high-fidelity mock map and satellite coordinates
  const getVenueIframe = (venue: string) => {
    // Elegant standard embedded Map locator coordinates for student ease of access
    return (
      <div className="w-full h-48 rounded-xl overflow-hidden relative border border-gray-100 dark:border-slate-700 shadow-inner bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.750275825247!2d80.2185566759714!3d12.923746615243394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a525df1881e1f7f%3A0x6fb87859842a22cc!2sCollege%20of%20Engineering%2C%20Guindy!5e0!3m2!1sen!2sin!4v1713580000000!5m2!1sen!2sin"
          className="w-full h-full border-0 grayscale opacity-85 dark:opacity-75 dark:invert"
          allowFullScreen={false}
          loading="lazy"
          title="Venue Navigation Map"
        />
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-md text-white text-[10px] font-bold tracking-wide flex items-center space-x-1 shadow-sm">
          <MapPin className="w-3 h-3 text-red-500" />
          <span>{venue} Coordinates</span>
        </div>
      </div>
    );
  };

  return (
    <div 
      id="event-details-overlay" 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
    >
      <div 
        id="event-details-container" 
        className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col relative animate-scale-up"
      >
        {/* Close Button */}
        <button
          id="close-details-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition active:scale-95 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Hero Banner Image */}
        <div className="relative h-64 sm:h-72 w-full shrink-0">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-black/10" />
          
          <div className="absolute bottom-6 left-6 right-6">
            <span className="text-[10px] bg-blue-600 text-white font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
              {event.category}
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white mt-3 tracking-tight">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Content Box (scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm" id="details-modal-scrollable">
          
          {/* Main Description */}
          <div>
            <h4 className="font-display font-bold text-gray-900 dark:text-white text-base mb-2">Event Overview</h4>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed font-light">
              {event.description}
            </p>
          </div>

          {/* Rules Section */}
          {rulesList.length > 0 && (
            <div>
              <h4 className="font-display font-bold text-gray-900 dark:text-white text-base mb-2 flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-blue-500" />
                <span>Symposium Rules & Guidelines</span>
              </h4>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-slate-300 font-light">
                {rulesList.map((rule, idx) => (
                  <li key={idx}>{rule}.</li>
                ))}
              </ul>
            </div>
          )}

          {/* Coordinator & Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/60">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Organizers & Coordinator</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1 text-base">{event.coordinator}</p>
              <div className="flex items-center space-x-2 text-gray-500 dark:text-slate-400 text-xs mt-1">
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                <span>+91 98765 43210</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/60">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Faculty In-charge</span>
              <p className="font-bold text-gray-900 dark:text-white mt-1 text-base">{event.faculty}</p>
              <div className="flex items-center space-x-2 text-gray-500 dark:text-slate-400 text-xs mt-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Senior Professor, Block-C</span>
              </div>
            </div>
          </div>

          {/* Venue & Location Iframe */}
          <div>
            <h4 className="font-display font-bold text-gray-900 dark:text-white text-base mb-2 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Location Tracker ({event.venue})</span>
            </h4>
            {getVenueIframe(event.venue)}
          </div>
        </div>

        {/* Footer Area with Booking Action */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-bold">Registration Fee</span>
            <span className="text-xl font-extrabold text-gray-900 dark:text-white">
              {formatCurrency(event.fee)}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{event.available_seats} / {event.capacity} seats remaining</span>
            </span>
          </div>

          <div className="flex space-x-3">
            <button
              id="details-close-btn"
              onClick={onClose}
              className="px-5 py-2.5 font-bold text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer border border-gray-200 dark:border-slate-600"
            >
              Close
            </button>
            {isRegistered ? (
              <button
                id="details-already-registered-btn"
                disabled
                className="px-6 py-2.5 font-bold text-sm bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl cursor-not-allowed border border-emerald-200 dark:border-emerald-800"
              >
                Already Registered
              </button>
            ) : (
              <button
                id="details-register-now-btn"
                onClick={onRegister}
                disabled={event.available_seats <= 0}
                className={`px-6 py-2.5 font-bold text-sm text-white rounded-xl shadow-md transition active:scale-95 cursor-pointer ${
                  event.available_seats <= 0
                    ? 'bg-gray-300 dark:bg-slate-700 cursor-not-allowed text-gray-400'
                    : 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20'
                }`}
              >
                {event.available_seats <= 0 ? 'Sold Out' : 'Register Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
