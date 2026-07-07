import React, { useState, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, ArrowUpDown, Bookmark, Award, HelpCircle, 
  User, CheckCircle, Sparkles, AlertCircle, Phone, Globe, Calendar, RefreshCw, X, ArrowRight
} from 'lucide-react';
import { apiFetch, getUser, setUser, removeToken, removeUser, formatCurrency, formatDate } from './utils';
import { Event, Registration, Notification } from './types';

// Components imports
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EventCard from './components/EventCard';
import EventDetailsModal from './components/EventDetailsModal';
import RegistrationModal from './components/RegistrationModal';
import Chatbot from './components/Chatbot';
import AdminPanel from './components/AdminPanel';
import AuthScreen from './components/AuthScreen';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Core records
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]); // Stored Event IDs

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Technical' | 'Non-Technical'>('All');
  const [sortBy, setSortBy] = useState<'default' | 'seats' | 'fee'>('default');

  // Selected records for modals
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null);
  const [selectedEventForRegister, setSelectedEventForRegister] = useState<Event | null>(null);

  // States
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notificationTrigger, setNotificationTrigger] = useState(0);

  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    college: '',
    department: '',
    year: '1' as '1' | '2' | '3' | '4',
    gender: 'Other' as 'Male' | 'Female' | 'Other',
    profile_image: ''
  });

  // Load initial states and authentication
  useEffect(() => {
    // Check local storage for existing session
    const loggedUser = getUser();
    if (loggedUser) {
      setCurrentUser(loggedUser);
      setProfileForm({
        name: loggedUser.name || '',
        phone: loggedUser.phone || '',
        college: loggedUser.college || '',
        department: loggedUser.department || '',
        year: loggedUser.year || '1',
        gender: loggedUser.gender || 'Other',
        profile_image: loggedUser.profile_image || ''
      });
      // Redirect admins immediately to admin portal
      if (loggedUser.role === 'admin') {
        setCurrentTab('admin');
      }
    }

    // Read system theme setting
    const root = window.document.documentElement;
    const initialTheme = localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  // Fetch events on mount or user shift
  useEffect(() => {
    fetchEvents();
    if (currentUser && currentUser.role === 'student') {
      fetchStudentRegistrations();
      fetchFavorites();
    }
  }, [currentUser]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await apiFetch('/api/events');
      setEvents(data);
    } catch (e: any) {
      showToast('Could not load symposium events. Running DB init might help.', 'error');
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchStudentRegistrations = async () => {
    try {
      const data = await apiFetch('/api/registrations');
      setMyRegistrations(data);
    } catch (e) {
      console.error('Failed to load registered events:', e);
    }
  };

  const fetchFavorites = async () => {
    try {
      const data = await apiFetch('/api/favorites');
      setFavorites(data.map((fav: any) => fav.event_id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFavorite = async (eventId: number) => {
    if (!currentUser) {
      showToast('Please sign in to save your favorite events', 'error');
      return;
    }
    
    const isAlreadyFav = favorites.includes(eventId);
    try {
      if (isAlreadyFav) {
        await apiFetch(`/api/favorites/${eventId}`, { method: 'DELETE' });
        setFavorites(prev => prev.filter(id => id !== eventId));
        showToast('Event removed from bookmarks', 'success');
      } else {
        await apiFetch('/api/favorites', {
          method: 'POST',
          body: JSON.stringify({ event_id: eventId })
        });
        setFavorites(prev => [...prev, eventId]);
        showToast('Event added to bookmarks!', 'success');
      }
    } catch (e) {
      showToast('Action failed', 'error');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm)
      });
      setCurrentUser(updatedUser);
      setUser(updatedUser);
      showToast('Symposium Profile saved successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Profile save failed', 'error');
    }
  };

  const handleLogout = () => {
    removeToken();
    removeUser();
    setCurrentUser(null);
    setCurrentTab('dashboard');
    showToast('Logged out of session. See you soon!', 'success');
  };

  const toggleTheme = () => {
    const root = window.document.documentElement;
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Filter / Sort Logic
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' ? true : e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'seats') {
      return b.available_seats - a.available_seats;
    }
    if (sortBy === 'fee') {
      return a.fee - b.fee;
    }
    return 0; // Default order
  });

  const registeredEventIds = myRegistrations.map(r => r.event_id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 text-gray-800 dark:text-slate-100 pb-20 relative">
      
      {/* If not logged in, render the Auth Entrance Screen */}
      {!currentUser ? (
        <AuthScreen 
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setProfileForm({
              name: user.name || '',
              phone: user.phone || '',
              college: user.college || '',
              department: user.department || '',
              year: user.year || '1',
              gender: user.gender || 'Other',
              profile_image: user.profile_image || ''
            });
            if (user.role === 'admin') {
              setCurrentTab('admin');
            } else {
              setCurrentTab('dashboard');
            }
          }}
          triggerToast={showToast}
        />
      ) : (
        /* Authenticated Student/Admin layout */
        <>
          <Navbar 
            currentUser={currentUser} 
            onLogout={handleLogout}
            onNavigate={(tab) => {
              if (currentUser.role === 'admin' && tab !== 'admin' && tab !== 'dashboard' && tab !== 'events') {
                showToast('Admins are confined to event command modules!', 'error');
                return;
              }
              setCurrentTab(tab);
            }}
            currentTab={currentTab}
            theme={theme}
            toggleTheme={toggleTheme}
            notificationTrigger={notificationTrigger}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            
            {/* RENDER TAB 1: DASHBOARD PORTAL */}
            {currentTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in" id="student-dashboard">
                <Hero 
                  onBrowse={() => setCurrentTab('events')} 
                  onMyTickets={() => setCurrentTab('registrations')} 
                  registeredCount={myRegistrations.length}
                />

                {/* Dashboard grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left columns: Saved bookmarked events + recommendations */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Favorites Section */}
                    <div id="dashboard-favorites-section">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-display font-extrabold text-xl text-gray-900 dark:text-white flex items-center space-x-2">
                          <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span>My Bookmarked Events</span>
                        </h3>
                        {favorites.length > 0 && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-bold">
                            {favorites.length} Saved
                          </span>
                        )}
                      </div>

                      {favorites.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 rounded-2xl text-center space-y-3 shadow-xs">
                          <Bookmark className="w-8 h-8 text-gray-300 mx-auto" />
                          <p className="text-xs text-gray-400 dark:text-slate-500 max-w-sm mx-auto">
                            No bookmarked events yet. Click on the heart icon of any workshop or gaming event to save them here for quick access.
                          </p>
                          <button
                            id="explore-favs-btn"
                            onClick={() => setCurrentTab('events')}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition"
                          >
                            Browse All Events
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="fav-events-grid">
                          {events.filter(e => favorites.includes(e.id)).map(favEvent => (
                            <EventCard
                              key={favEvent.id}
                              event={favEvent}
                              isFavorited={true}
                              isRegistered={registeredEventIds.includes(favEvent.id)}
                              onViewDetails={() => setSelectedEventForDetails(favEvent)}
                              onRegister={() => setSelectedEventForRegister(favEvent)}
                              onToggleFavorite={() => handleToggleFavorite(favEvent.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quick Recommendations Section */}
                    <div id="dashboard-recommendations-section">
                      <h3 className="font-display font-extrabold text-xl text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <Award className="w-5 h-5 text-indigo-500" />
                        <span>Recommended for You</span>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="recommended-events-grid">
                        {events.slice(0, 2).map(recEvent => (
                          <EventCard
                            key={recEvent.id}
                            event={recEvent}
                            isFavorited={favorites.includes(recEvent.id)}
                            isRegistered={registeredEventIds.includes(recEvent.id)}
                            onViewDetails={() => setSelectedEventForDetails(recEvent)}
                            onRegister={() => setSelectedEventForRegister(recEvent)}
                            onToggleFavorite={() => handleToggleFavorite(recEvent.id)}
                          />
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right column: Quick contacts / rules and announcements */}
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xs" id="symposium-guidelines">
                      <h4 className="font-display font-bold text-gray-900 dark:text-white mb-3 text-sm">Symposium Guidelines</h4>
                      <ul className="space-y-3 text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-light">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>All students must carry their college identity cards along with their generated QR PDF passes.</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Upon successful simulation checkout, you will receive an automatic confirmation notification and printable ticket.</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>Refreshments and symposium lunch are included in the registration passes of technical workshops.</span>
                        </li>
                        <li className="flex items-start space-x-2 border-t border-dashed border-gray-100 dark:border-slate-800 pt-2.5 mt-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-600 dark:text-slate-300">
                            System Database: Running on high-performance <strong className="text-blue-600 dark:text-blue-400 font-bold">SQLite 3</strong> relational persistence. The MongoDB stack has been fully removed.
                          </span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl border border-indigo-950 shadow-md relative overflow-hidden" id="symposium-helpdesk">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full filter blur-xl" />
                      <HelpCircle className="w-8 h-8 text-indigo-400 mb-3" />
                      <h4 className="font-display font-bold text-base mb-1">Need help or assistance?</h4>
                      <p className="text-xs text-indigo-200 leading-relaxed font-light mb-4">
                        Our student support committee and AI chatbot are ready to answer your queries 24/7. Feel free to contact the helpdesk below.
                      </p>
                      <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <span>+91 91234 56780</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* RENDER TAB 2: BROWSE EVENTS CATALOG */}
            {currentTab === 'events' && (
              <div className="space-y-6 animate-fade-in" id="events-explorer">
                {/* Search & filters head */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center" id="search-filter-panel">
                  
                  {/* Search box */}
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search workshops, coding contests, gaming..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Filter chips & sort options */}
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto" id="filter-sorting-controls">
                    
                    {/* Categories switcher */}
                    <div className="flex space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-bold" id="category-filter-group">
                      {['All', 'Technical', 'Non-Technical'].map(cat => (
                        <button
                          id={`cat-filter-btn-${cat.toLowerCase().replace(' ', '')}`}
                          key={cat}
                          onClick={() => setCategoryFilter(cat as any)}
                          className={`px-3 py-1.5 rounded-lg transition ${
                            categoryFilter === cat
                              ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Sorter */}
                    <div className="flex items-center space-x-2 text-xs font-bold" id="sort-controls">
                      <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-slate-100 dark:bg-slate-950 text-gray-700 dark:text-slate-300 px-3 py-2 rounded-xl outline-none"
                      >
                        <option value="default">Default Sort</option>
                        <option value="seats">Most Seats Available</option>
                        <option value="fee">Lowest Registration Fee</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* Listing Results */}
                {loadingEvents ? (
                  <div className="py-24 text-center space-y-3" id="loading-skeletons">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                    <p className="text-xs text-gray-400">Loading dynamic event catalog...</p>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="py-24 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 text-center space-y-2" id="empty-catalog-results">
                    <SlidersHorizontal className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="font-bold text-gray-900 dark:text-white text-base">No matching events found</p>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">Try altering your keywords, selecting different category filters, or resetting filters to browse all 20 events.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="catalog-events-grid">
                    {filteredEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isFavorited={favorites.includes(event.id)}
                        isRegistered={registeredEventIds.includes(event.id)}
                        onViewDetails={() => setSelectedEventForDetails(event)}
                        onRegister={() => setSelectedEventForRegister(event)}
                        onToggleFavorite={() => handleToggleFavorite(event.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RENDER TAB 3: STUDENT MY REGISTRATIONS PASSES */}
            {currentTab === 'registrations' && currentUser?.role === 'student' && (
              <div className="space-y-6 animate-fade-in" id="student-registrations-explorer">
                <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                  <h2 className="font-display font-black text-2xl text-gray-900 dark:text-white">My Symposium Event passes</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">View details, download printable PDF tickets, or present QR codes at event entry tables.</p>
                </div>

                {myRegistrations.length === 0 ? (
                  <div className="py-24 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 text-center space-y-3 shadow-xs" id="empty-registrations">
                    <Award className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
                    <p className="font-bold text-gray-900 dark:text-white text-base">You haven&apos;t registered for any events yet</p>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">Discover national level workshops, presentation panels, and gaming challenges to lock your seat today.</p>
                    <button
                      id="browse-now-from-empty-btn"
                      onClick={() => setCurrentTab('events')}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/15"
                    >
                      Browse Events Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="registrations-list">
                    {myRegistrations.map(reg => (
                      <div 
                        key={reg.id} 
                        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between"
                        id={`reg-pass-${reg.id}`}
                      >
                        <div className="p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded uppercase">
                                CONFIRMED ENTRY
                              </span>
                              <h3 className="font-display font-extrabold text-lg text-gray-900 dark:text-white mt-1.5 leading-snug">
                                {reg.event_title}
                              </h3>
                            </div>
                            
                            {/* In-app QR Code popup trigger */}
                            {reg.qr_code && (
                              <div className="w-12 h-12 rounded-lg border border-gray-100 p-1 bg-white shrink-0">
                                <img src={reg.qr_code} alt="Entry pass QR" className="w-full h-full object-contain" />
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-600 dark:text-slate-400">
                            <div>
                              <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">Event Timings</span>
                              <p className="text-gray-900 dark:text-slate-200 mt-0.5">{reg.event_date}</p>
                              <p className="text-[10px] text-gray-500">{reg.event_time}</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">Venue Location</span>
                              <p className="text-gray-900 dark:text-slate-200 mt-0.5 truncate">{reg.venue}</p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-50 dark:border-slate-800 flex justify-between items-center text-xs">
                            <div>
                              <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">Registration Pass ID</span>
                              <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{reg.registration_id}</p>
                            </div>
                            <div>
                              <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">Payment Method</span>
                              <p className="capitalize text-slate-700 dark:text-slate-300 font-bold">{reg.payment_status}</p>
                            </div>
                          </div>
                        </div>

                        {/* Interactive ticket actions */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-gray-100 dark:border-slate-800 flex space-x-2">
                          <a
                            id={`download-pdf-btn-${reg.id}`}
                            href={`/api/registrations/${reg.id}/ticket`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs text-center shadow-xs cursor-pointer"
                          >
                            Print PDF Pass
                          </a>
                          
                          <button
                            id={`present-qr-trigger-${reg.id}`}
                            onClick={() => {
                              showToast(`Presented pass ID: ${reg.registration_id} to examiner`, 'success');
                            }}
                            className="flex-1 py-2 rounded-xl bg-white hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                          >
                            Scan in App
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* RENDER TAB 4: STUDENT PROFILE MANAGEMENT */}
            {currentTab === 'profile' && currentUser?.role === 'student' && (
              <div className="max-w-xl mx-auto animate-fade-in" id="student-profile-explorer">
                <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
                  <h2 className="font-display font-black text-2xl text-gray-900 dark:text-white">Symposium Registration Profile</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Save your academic registry to fast-track bookings and notifications.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xs space-y-4 text-xs font-medium">
                  <div>
                    <label className="block text-gray-400 uppercase tracking-wider font-bold mb-1">Full Student Name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 uppercase tracking-wider font-bold mb-1">College/Institution</label>
                      <input
                        type="text"
                        required
                        value={profileForm.college}
                        onChange={(e) => setProfileForm({ ...profileForm, college: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 uppercase tracking-wider font-bold mb-1">Department Branch</label>
                      <input
                        type="text"
                        required
                        value={profileForm.department}
                        onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 uppercase tracking-wider font-bold mb-1">Year of Study</label>
                      <select
                        value={profileForm.year}
                        onChange={(e) => setProfileForm({ ...profileForm, year: e.target.value as any })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 uppercase tracking-wider font-bold mb-1">Gender</label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value as any })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 uppercase tracking-wider font-bold mb-1">Mobile Contact No</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 uppercase tracking-wider font-bold mb-1">Profile Avatar Image Link</label>
                    <input
                      type="url"
                      value={profileForm.profile_image}
                      onChange={(e) => setProfileForm({ ...profileForm, profile_image: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                    <button
                      id="save-profile-btn"
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      Save Profile details
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* RENDER TAB 5: ADMIN CONSOLE */}
            {currentTab === 'admin' && currentUser?.role === 'admin' && (
              <div className="animate-fade-in" id="admin-module-wrapper">
                <AdminPanel 
                  triggerToast={showToast} 
                  allEvents={events}
                  onRefreshEvents={fetchEvents}
                />
              </div>
            )}

          </main>

          {/* Chatbot floating assistant overlay */}
          <Chatbot />
        </>
      )}

      {/* RENDER EVENT DETAILS LARGE OVERLAY MODAL */}
      {selectedEventForDetails && (
        <EventDetailsModal
          event={selectedEventForDetails}
          isRegistered={registeredEventIds.includes(selectedEventForDetails.id)}
          onClose={() => setSelectedEventForDetails(null)}
          onRegister={() => {
            setSelectedEventForRegister(selectedEventForDetails);
            setSelectedEventForDetails(null);
          }}
        />
      )}

      {/* RENDER EVENT REGISTRATION FORM & PAYMENT GATEWAY MODAL */}
      {selectedEventForRegister && (
        <RegistrationModal
          event={selectedEventForRegister}
          currentUser={currentUser}
          onClose={() => setSelectedEventForRegister(null)}
          onSuccess={() => {
            setSelectedEventForRegister(null);
            fetchStudentRegistrations();
            fetchEvents();
            // Trigger navbar notifications update count
            setNotificationTrigger(prev => prev + 1);
          }}
          triggerToast={showToast}
          apiFetchWrapper={apiFetch}
        />
      )}

      {/* PREMIUM HIGH FIDELITY DYNAMIC TOASTS PORTAL */}
      <div className="fixed bottom-6 left-6 z-50 space-y-2 flex flex-col" id="global-toasts-portal">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`p-4 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs max-w-sm transition duration-300 transform translate-y-0 scale-100 border text-white animate-slideup ${
              t.type === 'error' 
                ? 'bg-red-600 border-red-500' 
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            {t.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-100 shrink-0" /> : <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            <span className="font-semibold">{t.message}</span>
            <button 
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="p-1 rounded-full hover:bg-white/10 text-white/80 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
