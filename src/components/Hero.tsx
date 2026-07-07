import { useState, useEffect } from 'react';
import { Sparkles, Calendar, MapPin, Ticket, Clock } from 'lucide-react';

interface HeroProps {
  onBrowse: () => void;
  onMyTickets?: () => void;
  registeredCount: number;
}

export default function Hero({ onBrowse, onMyTickets, registeredCount }: HeroProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-09-10T09:00:00').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div id="hero-banner" className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 text-white rounded-2xl overflow-hidden shadow-xl mb-8 border border-blue-900/50">
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25" />
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

      <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-16 text-center" id="hero-content">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-blue-300 text-xs font-semibold mb-6 animate-bounce">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>NATIONAL LEVEL TECHNICAL SYMPOSIUM</span>
        </div>

        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tight mb-4 leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-blue-100">
          TechFest 2026
        </h1>
        
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-blue-200 mb-8 leading-relaxed font-light">
          Join XYZ College of Engineering&apos;s ultimate technology arena. 20 premier workshops, coding challenges, hackathons, and non-technical games. Unleash the coder, designer, and speaker inside you!
        </p>

        {/* Info badges */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium mb-10 text-slate-100" id="hero-info-badges">
          <div className="flex items-center space-x-2 bg-slate-900/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Sept 10 - 19, 2026</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
            <MapPin className="w-4 h-4 text-red-400" />
            <span>Campus Auditorium & Block Labs</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
            <Ticket className="w-4 h-4 text-emerald-400" />
            <span>{registeredCount > 0 ? `${registeredCount} Booked!` : 'Registrations Open'}</span>
          </div>
        </div>

        {/* High fidelity countdown timer */}
        <div className="mb-10" id="hero-countdown-timer">
          <p className="text-xs text-blue-300 uppercase tracking-widest font-semibold mb-3 flex items-center justify-center space-x-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Symposium Countdown</span>
          </p>
          <div className="flex justify-center items-center space-x-3 sm:space-x-4">
            <div className="flex flex-col items-center bg-slate-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-3 sm:p-4 min-w-[65px] sm:min-w-[80px] shadow-lg">
              <span className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-tight">{timeLeft.days}</span>
              <span className="text-[10px] sm:text-xs text-blue-300 font-medium uppercase mt-1">Days</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-blue-400/80 animate-ping">:</span>
            <div className="flex flex-col items-center bg-slate-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-3 sm:p-4 min-w-[65px] sm:min-w-[80px] shadow-lg">
              <span className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-tight">{timeLeft.hours}</span>
              <span className="text-[10px] sm:text-xs text-blue-300 font-medium uppercase mt-1">Hrs</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-blue-400/80 animate-ping">:</span>
            <div className="flex flex-col items-center bg-slate-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-3 sm:p-4 min-w-[65px] sm:min-w-[80px] shadow-lg">
              <span className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-tight">{timeLeft.minutes}</span>
              <span className="text-[10px] sm:text-xs text-blue-300 font-medium uppercase mt-1">Mins</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-blue-400/80 animate-ping">:</span>
            <div className="flex flex-col items-center bg-slate-900/50 backdrop-blur-lg border border-white/10 rounded-2xl p-3 sm:p-4 min-w-[65px] sm:min-w-[80px] shadow-lg">
              <span className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-tight">{timeLeft.seconds}</span>
              <span className="text-[10px] sm:text-xs text-blue-300 font-medium uppercase mt-1">Secs</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center space-x-4" id="hero-actions">
          <button
            id="hero-browse-btn"
            onClick={onBrowse}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm tracking-wide transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            Explore Events &rarr;
          </button>
          {onMyTickets && registeredCount > 0 && (
            <button
              id="hero-tickets-btn"
              onClick={onMyTickets}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 font-bold text-sm tracking-wide transition-all active:scale-95 cursor-pointer"
            >
              My Tickets ({registeredCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
