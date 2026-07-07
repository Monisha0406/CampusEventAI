import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, CheckCircle, XCircle, Search, Download, 
  Users, Ticket, IndianRupee, Star, RefreshCw, BarChart2, List, Shield, ToggleLeft, ToggleRight, Trash
} from 'lucide-react';
import { apiFetch, formatCurrency, formatDate } from '../utils';
import { Event, Registration, Payment, AnalyticsSummary } from '../types';

interface AdminPanelProps {
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  allEvents: Event[];
  onRefreshEvents: () => void;
}

export default function AdminPanel({ triggerToast, allEvents, onRefreshEvents }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'events' | 'registrations' | 'payments'>('analytics');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  
  // Search states
  const [regSearch, setRegSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Event modal creation state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'Technical' as 'Technical' | 'Non-Technical',
    description: '',
    rules: '',
    venue: '',
    event_date: '',
    event_time: '',
    coordinator: '',
    faculty: '',
    capacity: 50,
    fee: 0,
    image_url: ''
  });

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'analytics') {
        const data = await apiFetch('/api/admin/analytics');
        setAnalytics(data);
      } else if (activeTab === 'registrations') {
        const data = await apiFetch(`/api/admin/registrations${regSearch ? `?search=${regSearch}` : ''}`);
        setRegistrations(data);
      } else if (activeTab === 'payments') {
        const data = await apiFetch('/api/admin/payments');
        setPayments(data);
      }
    } catch (e: any) {
      triggerToast(e.message || 'Failed to fetch admin dashboard records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCloseReg = async (eventId: number) => {
    try {
      const res = await apiFetch(`/api/admin/events/${eventId}/close`, { method: 'PATCH' });
      triggerToast(res.is_active === 1 ? 'Registrations opened successfully' : 'Registrations closed successfully', 'success');
      onRefreshEvents();
    } catch (e: any) {
      triggerToast(e.message || 'Action failed', 'error');
    }
  };

  const handleSoftDelete = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event? (Soft delete)')) return;
    try {
      await apiFetch(`/api/admin/events/${eventId}`, { method: 'DELETE' });
      triggerToast('Event soft-deleted successfully', 'success');
      onRefreshEvents();
    } catch (e: any) {
      triggerToast(e.message || 'Action failed', 'error');
    }
  };

  const handleUpdateCapacityOnly = async (eventId: number, currentCap: number) => {
    const input = prompt('Enter new seat capacity:', currentCap.toString());
    if (input === null) return;
    const capacity = parseInt(input);
    if (isNaN(capacity) || capacity <= 0) {
      triggerToast('Please provide a valid seat capacity', 'error');
      return;
    }

    try {
      await apiFetch(`/api/admin/events/${eventId}/seats`, {
        method: 'PATCH',
        body: JSON.stringify({ capacity })
      });
      triggerToast('Capacity updated successfully', 'success');
      onRefreshEvents();
    } catch (e: any) {
      triggerToast(e.message || 'Action failed', 'error');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      category: 'Technical',
      description: '',
      rules: '',
      venue: '',
      event_date: '2026-09-10',
      event_time: '10:00 AM',
      coordinator: '',
      faculty: '',
      capacity: 50,
      fee: 0,
      image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
    });
    setShowEventModal(true);
  };

  const handleOpenEditModal = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      category: event.category,
      description: event.description,
      rules: event.rules,
      venue: event.venue,
      event_date: event.event_date,
      event_time: event.event_time,
      coordinator: event.coordinator,
      faculty: event.faculty,
      capacity: event.capacity,
      fee: event.fee,
      image_url: event.image_url
    });
    setShowEventModal(true);
  };

  const handleEventFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        // Update Event
        await apiFetch(`/api/admin/events/${editingEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(eventForm)
        });
        triggerToast('Symposium event updated successfully!', 'success');
      } else {
        // Create Event
        await apiFetch('/api/admin/events', {
          method: 'POST',
          body: JSON.stringify(eventForm)
        });
        triggerToast('New symposium event added and broadcasted!', 'success');
      }
      setShowEventModal(false);
      onRefreshEvents();
    } catch (err: any) {
      triggerToast(err.message || 'Action failed', 'error');
    }
  };

  const handleExportCSV = () => {
    // Open the CSV download endpoint directly
    window.open('/api/admin/registrations/export/excel', '_blank');
  };

  return (
    <div id="admin-panel-container" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 dark:text-white flex items-center space-x-2">
            <Shield className="w-6 h-6 text-red-600 animate-pulse" />
            <span>Administrator Console</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">XYZ College TechFest &apos;26 Symposium Command Room</p>
          
          {/* Database Stack Status Indicator */}
          <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]" id="db-stack-status-badges">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              SQLite 3: Active & Persistent
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold border border-rose-100 dark:border-rose-900/30 line-through">
              MongoDB: Removed
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3 sm:mt-0 flex gap-2">
          <button
            id="admin-refresh-btn"
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 cursor-pointer"
            title="Reload metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            id="admin-add-event-btn"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-red-500/10 cursor-pointer transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-Tabs */}
      <div className="flex space-x-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl" id="admin-subtabs">
        <button
          id="admin-tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span className="hidden sm:inline">Analytics & Stats</span>
        </button>
        <button
          id="admin-tab-events"
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
            activeTab === 'events'
              ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
          }`}
        >
          <List className="w-4 h-4" />
          <span className="hidden sm:inline">Manage Events</span>
        </button>
        <button
          id="admin-tab-registrations"
          onClick={() => setActiveTab('registrations')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
            activeTab === 'registrations'
              ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span className="hidden sm:inline">Student Registrations</span>
        </button>
        <button
          id="admin-tab-payments"
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
            activeTab === 'payments'
              ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          <span className="hidden sm:inline">Payment Registry</span>
        </button>
      </div>

      {/* RENDER ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6" id="admin-analytics-view">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Users</p>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{analytics.summary.totalUsers}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Registrations</p>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{analytics.summary.totalRegistrations}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Revenue</p>
                <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{formatCurrency(analytics.summary.totalRevenue)}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400">
                <Star className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">Popular Event</p>
                <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5 truncate max-w-[140px]">{analytics.summary.popularEvent}</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{analytics.summary.popularEventCount} registrations</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual Bar Graph showing Seats & Registration Ratio */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs">
              <h3 className="font-display font-bold text-base text-gray-900 dark:text-white mb-4">Symposium Registration Stats by Event</h3>
              <div className="space-y-4" id="visual-bars-container">
                {analytics.seatsSummary.slice(0, 5).map((e, i) => {
                  const percent = e.capacity > 0 ? Math.round((e.registered / e.capacity) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1.5" id={`stat-bar-item-${i}`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700 dark:text-slate-300">{e.title}</span>
                        <span className="text-gray-500 dark:text-slate-400">{e.registered} / {e.capacity} booked ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            percent >= 90 ? 'bg-red-500' : percent >= 60 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily Registrations bar meter */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs">
              <h3 className="font-display font-bold text-base text-gray-900 dark:text-white mb-4">Daily Bookings Activity (Last 7 Days)</h3>
              {analytics.dailyRegistrations.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-xs text-gray-400">
                  No activity recorded yet. Showings will populate once students check out.
                </div>
              ) : (
                <div className="flex items-end justify-between h-44 pt-6 px-4 border-b border-slate-100 dark:border-slate-700" id="bookings-activity-chart">
                  {analytics.dailyRegistrations.map((d, i) => {
                    const maxVal = Math.max(...analytics.dailyRegistrations.map(x => x.count), 1);
                    const percentHeight = Math.round((d.count / maxVal) * 100);
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 group" id={`activity-chart-bar-${i}`}>
                        <div className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                          {d.count}
                        </div>
                        <div 
                          className="w-8 sm:w-10 bg-blue-600 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-400 rounded-t-md transition-all duration-500"
                          style={{ height: `${Math.max(8, percentHeight * 1.2)}px` }}
                        />
                        <span className="text-[9px] text-gray-400 dark:text-slate-500 uppercase mt-2 font-medium">
                          {d.date.split('-')[2]}/{d.date.split('-')[1]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANAGE EVENTS TABLE */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-xs" id="admin-events-view">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>TechFest Event Catalog</span>
            <span>{allEvents.length} events total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] text-gray-500 uppercase font-bold tracking-wider border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="p-4">Event Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Venue</th>
                  <th className="p-4">Date/Time</th>
                  <th className="p-4">Seats status</th>
                  <th className="p-4">Reg Fee</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700" id="events-table-body">
                {allEvents.map(ev => (
                  <tr key={ev.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <img src={ev.image_url} alt={ev.title} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        <span className="truncate max-w-[150px]">{ev.title}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ev.category === 'Technical' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                        {ev.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{ev.venue}</td>
                    <td className="p-4">
                      <div className="font-semibold">{ev.event_date}</div>
                      <div className="text-[10px] text-gray-400">{ev.event_time}</div>
                    </td>
                    <td className="p-4 font-semibold text-gray-600 dark:text-slate-300">
                      {ev.available_seats} / {ev.capacity} left
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                      {formatCurrency(ev.fee)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          id={`admin-edit-event-${ev.id}`}
                          onClick={() => handleOpenEditModal(ev)}
                          className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 transition"
                          title="Edit Details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`admin-adjust-seats-${ev.id}`}
                          onClick={() => handleUpdateCapacityOnly(ev.id, ev.capacity)}
                          className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition"
                          title="Adjust Seat Limits"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`admin-close-reg-${ev.id}`}
                          onClick={() => handleToggleCloseReg(ev.id)}
                          className={`p-1.5 rounded transition ${ev.is_active === 1 ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
                          title={ev.is_active === 1 ? 'Close Registrations' : 'Open Registrations'}
                        >
                          {ev.is_active === 1 ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          id={`admin-delete-event-${ev.id}`}
                          onClick={() => handleSoftDelete(ev.id)}
                          className="p-1.5 rounded bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition"
                          title="Soft Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STUDENT REGISTRATIONS REGISTER */}
      {activeTab === 'registrations' && (
        <div className="space-y-4" id="admin-registrations-view">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                id="admin-reg-search"
                type="text"
                placeholder="Search registrations by name, email, event, or ID..."
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchAdminData();
                  }
                }}
                className="w-full bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm outline-none focus:border-blue-500"
              />
            </div>
            
            <button
              id="admin-export-csv-btn"
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/10 cursor-pointer transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] text-gray-500 uppercase font-bold tracking-wider border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    <th className="p-4">Reg ID</th>
                    <th className="p-4">Student Info</th>
                    <th className="p-4">College Details</th>
                    <th className="p-4">Registered Event</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Booking Date</th>
                    <th className="p-4 text-center">Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700" id="registrations-table-body">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
                        No registrations matching the search query found.
                      </td>
                    </tr>
                  ) : (
                    registrations.map(reg => (
                      <tr key={reg.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {reg.registration_id}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900 dark:text-white">{reg.student_name}</div>
                          <div className="text-[10px] text-gray-500">{reg.student_email}</div>
                          <div className="text-[10px] text-gray-400">{reg.student_phone || 'No phone'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-800 dark:text-slate-200 truncate max-w-[120px]">{reg.student_college || 'XYZ College'}</div>
                          <div className="text-[10px] text-gray-500">{reg.student_dept} - Year {reg.student_year}</div>
                        </td>
                        <td className="p-4 font-semibold text-gray-900 dark:text-white truncate max-w-[150px]">
                          {reg.event_title}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            reg.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            reg.payment_status === 'free' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                            'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}>
                            {reg.payment_status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 text-[10px]">
                          {reg.registered_at ? new Date(reg.registered_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-4 text-center">
                          <a
                            id={`admin-download-ticket-${reg.id}`}
                            href={`/api/registrations/${reg.id}/ticket`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded font-bold transition inline-block"
                          >
                            PDF
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER PAYMENT REGISTRY */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-xs" id="admin-payments-view">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Payment Audit Registry</span>
            <span>{payments.length} captured transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] text-gray-500 uppercase font-bold tracking-wider border-b border-gray-100 dark:border-slate-700">
                <tr>
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Reg ID</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Symposium Event</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700" id="payments-table-body">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">No payment records found.</td>
                  </tr>
                ) : (
                  payments.map(pay => (
                    <tr key={pay.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 font-mono font-semibold text-gray-500">
                        {pay.transaction_id}
                      </td>
                      <td className="p-4 font-bold text-blue-600 dark:text-blue-400">
                        {pay.registration_id}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900 dark:text-white">{pay.student_name}</div>
                        <div className="text-[10px] text-gray-500">{pay.student_email}</div>
                      </td>
                      <td className="p-4 font-semibold text-gray-800 dark:text-slate-200">
                        {pay.event_title}
                      </td>
                      <td className="p-4 font-bold text-gray-950 dark:text-white">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="p-4 font-medium text-gray-500 capitalize">
                        {pay.payment_method || 'Simulator'}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 flex items-center w-fit space-x-1">
                          <CheckCircle className="w-3 h-3 shrink-0" />
                          <span>CAPTURED</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / UPDATE SYMPOSIUM EVENT MODAL FORM */}
      {showEventModal && (
        <div id="event-form-overlay" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div id="event-form-modal" className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">COMMAND CENTER</span>
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mt-1">
                  {editingEvent ? 'Modify Symposium Event' : 'Create Symposium Event'}
                </h3>
              </div>
              <button
                id="close-event-form-btn"
                onClick={() => setShowEventModal(false)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEventFormSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div>
                <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. advanced AI Hackathon"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Non-Technical">Non-Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Venue Hall</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Block C Hall 2"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Event Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 09:30 AM"
                    value={eventForm.event_time}
                    onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Seat Capacity</label>
                  <input
                    type="number"
                    required
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Registration Fee (INR)</label>
                  <input
                    type="number"
                    required
                    value={eventForm.fee}
                    onChange={(e) => setEventForm({ ...eventForm, fee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Student Coordinator</label>
                  <input
                    type="text"
                    required
                    placeholder="Student full name"
                    value={eventForm.coordinator}
                    onChange={(e) => setEventForm({ ...eventForm, coordinator: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Faculty In-charge</label>
                  <input
                    type="text"
                    required
                    placeholder="Prof. name"
                    value={eventForm.faculty}
                    onChange={(e) => setEventForm({ ...eventForm, faculty: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="Unsplash image URL"
                  value={eventForm.image_url}
                  onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Write clear description about symposium goals..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Rules & Guidelines (Dot separated)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bring your own laptops. Individual event. No plagiarisms"
                  value={eventForm.rules}
                  onChange={(e) => setEventForm({ ...eventForm, rules: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-slate-700/60 flex justify-end space-x-2">
                <button
                  id="event-form-cancel-btn"
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-5 py-2.5 font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="event-form-submit-btn"
                  type="submit"
                  className="px-5 py-2.5 font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl cursor-pointer shadow-md transition active:scale-95"
                >
                  {editingEvent ? 'Save Changes' : 'Broadcast Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
