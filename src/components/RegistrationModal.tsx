import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Landmark, QrCode, Sparkles } from 'lucide-react';
import { Event } from '../types';
import { formatCurrency } from '../utils';

interface RegistrationModalProps {
  event: Event;
  currentUser: any;
  onClose: () => void;
  onSuccess: () => void;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
  apiFetchWrapper: (endpoint: string, options?: RequestInit) => Promise<any>;
}

export default function RegistrationModal({ event, currentUser, onClose, onSuccess, triggerToast, apiFetchWrapper }: RegistrationModalProps) {
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    college: currentUser?.college || 'XYZ College of Engineering',
    department: currentUser?.department || '',
    year: currentUser?.year || '1',
    gender: currentUser?.gender || 'Other',
  });

  const [loading, setLoading] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'payment'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formData.phone || formData.phone.length < 10) {
      triggerToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }
    if (!formData.department) {
      triggerToast('Please provide your college department', 'error');
      return;
    }

    if (event.fee > 0) {
      // Go to Razorpay simulated payment gateway
      setCheckoutStep('payment');
    } else {
      // Register immediately for free
      completeRegistration();
    }
  };

  const completeRegistration = async (mockTxnId?: string) => {
    setLoading(true);
    try {
      const payload: any = {
        event_id: event.id,
        phone: formData.phone,
        department: formData.department,
        year: formData.year,
        gender: formData.gender,
        college: formData.college,
      };

      if (mockTxnId) {
        payload.razorpay_payment_id = mockTxnId;
        payload.payment_method = paymentMethod.toUpperCase();
      }

      const res = await apiFetchWrapper('/api/registrations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success) {
        triggerToast(`Registration successful! Generated ID: ${res.registration.registration_id}`, 'success');
        onSuccess();
      } else {
        triggerToast(res.error || 'Registration failed', 'error');
      }
    } catch (err: any) {
      triggerToast(err.message || 'An error occurred during registration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = () => {
    const randomTxn = `pay_MOCK_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    completeRegistration(randomTxn);
  };

  return (
    <div 
      id="reg-modal-overlay" 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
    >
      <div 
        id="reg-modal-container" 
        className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-md w-full flex flex-col relative animate-scale-up"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50 dark:bg-slate-900/30">
          <div>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">EVENT PASS BOOKING</span>
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mt-1 leading-snug">
              {event.title}
            </h3>
          </div>
          <button
            id="close-reg-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {checkoutStep === 'form' ? (
          /* STEP 1: Details Form */
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4" id="reg-form">
            <div className="bg-blue-50/50 dark:bg-blue-950/10 p-3.5 rounded-2xl border border-blue-100/50 dark:border-blue-900/20 text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-light mb-2">
              Please double check and verify your profile details before confirming booking. Free entry passes will be sent to your email instantly.
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Department</label>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g. IT, CSE, ECE"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Year of Study</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">College / Institute</label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-white text-sm focus:border-blue-500 outline-none"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-700/60 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Booking Cost</span>
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(event.fee)}</span>
              </div>

              <button
                type="submit"
                id="submit-form-btn"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
              >
                {event.fee > 0 ? 'Proceed to Payment' : 'Claim Free Pass'}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: Simulated Payment gateway (Razorpay Simulator) */
          <div className="p-6 space-y-6" id="reg-payment">
            <div className="bg-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between items-start relative overflow-hidden" id="card-payment-view">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/20 rounded-full filter blur-xl" />
              <div className="flex justify-between items-center w-full mb-4">
                <span className="text-xs bg-white/10 text-blue-200 px-3 py-1 rounded-full font-bold">Razorpay Test Gateway</span>
                <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Transaction Amount</p>
              <p className="text-3xl font-extrabold text-white mt-1">{formatCurrency(event.fee)}</p>
              <div className="mt-4 flex items-center justify-between w-full text-xs text-slate-400">
                <span>College TechFest Symposium</span>
                <span>SECURE PAY</span>
              </div>
            </div>

            {/* Simulated Payment Modes */}
            <div className="space-y-3" id="payment-modes">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Payment Method</p>
              
              <button
                id="pay-upi"
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                  paymentMethod === 'upi'
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                    : 'border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <QrCode className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-bold">UPI / GPay / PhonePe</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">Pay using secure QR Scan / UPI ID</p>
                  </div>
                </div>
                {paymentMethod === 'upi' && <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
              </button>

              <button
                id="pay-card"
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                    : 'border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-bold">Credit or Debit Card</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">Visa, MasterCard, RuPay, Maestro</p>
                  </div>
                </div>
                {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
              </button>

              <button
                id="pay-net"
                type="button"
                onClick={() => setPaymentMethod('netbanking')}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition ${
                  paymentMethod === 'netbanking'
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                    : 'border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Landmark className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-bold">Net Banking</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">All major Indian banks supported</p>
                  </div>
                </div>
                {paymentMethod === 'netbanking' && <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-700/60 flex items-center space-x-4">
              <button
                id="payment-back-btn"
                type="button"
                onClick={() => setCheckoutStep('form')}
                className="w-1/3 py-3 rounded-xl border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 text-sm font-bold transition cursor-pointer"
              >
                Back
              </button>

              <button
                id="simulate-pay-btn"
                type="button"
                onClick={handleSimulatePayment}
                disabled={loading}
                className="w-2/3 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                <span>{loading ? 'Processing...' : 'Simulate Success Pay'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
