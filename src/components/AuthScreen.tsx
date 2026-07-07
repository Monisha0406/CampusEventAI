import React, { useState } from 'react';
import { Calendar, Mail, Lock, User, Sparkles, LogIn, ArrowRight, Phone } from 'lucide-react';
import { apiFetch, setToken, setUser } from '../utils';

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
  triggerToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function AuthScreen({ onLoginSuccess, triggerToast }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dept, setDept] = useState('');
  const [year, setYear] = useState('1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        // Authenticate User
        const res = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        
        setToken(res.token);
        setUser(res.user);
        triggerToast(`Welcome back, ${res.user.name}!`, 'success');
        onLoginSuccess(res.user);
      } else {
        // Register User
        const res = await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            phone,
            department: dept,
            year
          })
        });

        setToken(res.token);
        setUser(res.user);
        triggerToast('Account created and logged in successfully!', 'success');
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      triggerToast(err.message || 'Authentication failed. Please check inputs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick sandbox helper to login with preset demo accounts
  const handleQuickLogin = async (demoRole: 'student' | 'admin') => {
    setLoading(true);
    const targetEmail = demoRole === 'admin' ? 'admin@symposium.com' : 'student@symposium.com';
    const targetPass = demoRole === 'admin' ? 'admin123' : 'student123';

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail, password: targetPass })
      });

      setToken(res.token);
      setUser(res.user);
      triggerToast(`Logged in as Demo ${demoRole === 'admin' ? 'Admin' : 'Student'}!`, 'success');
      onLoginSuccess(res.user);
    } catch (err: any) {
      triggerToast('Quick login failed. Running DB initialization first might help.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="auth-screen-root" 
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans"
    >
      {/* Decorative background visual elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4" id="auth-header">
        <div className="inline-flex items-center space-x-2 bg-blue-600/10 dark:bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full text-blue-600 dark:text-blue-400 text-xs font-semibold mb-4">
          <Calendar className="w-4 h-4 animate-spin-slow" />
          <span>XYZ College of Engineering &bull; Symposium 2026</span>
        </div>
        <h2 className="font-display font-black text-3xl sm:text-4xl tracking-tight text-gray-900 dark:text-white">
          CampusEvent AI
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
          The all-in-one smart portal to browse, register, pay, and get automated ticket entry passes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4" id="auth-card-wrapper">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 sm:px-10 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-xl space-y-6">
          
          {/* Main tabs for student / admin switcher */}
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl" id="auth-portal-tabs">
            <button
              id="auth-student-tab"
              onClick={() => {
                setActiveTab('student');
                setMode('login');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
                activeTab === 'student'
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
              }`}
            >
              Student Portal
            </button>
            <button
              id="auth-admin-tab"
              onClick={() => {
                setActiveTab('admin');
                setMode('login');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
                activeTab === 'admin'
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-800'
              }`}
            >
              Admin Command
            </button>
          </div>

          {/* Form Description */}
          <div className="text-center" id="auth-form-meta">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {activeTab === 'admin' ? 'Secure Administrator Login' : mode === 'login' ? 'Student Sign In' : 'New Student Registration'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="auth-form-body">
            {activeTab === 'student' && mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Dept</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSE"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Year</label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mobile No</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10 digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-500/10 hover:shadow-lg transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <span>{loading ? 'Validating Session...' : mode === 'login' ? 'Sign In Securely' : 'Sign Up & Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Mode Switcher */}
          {activeTab === 'student' && (
            <div className="text-center text-xs text-gray-500 dark:text-slate-400" id="auth-mode-switch-box">
              {mode === 'login' ? (
                <p>
                  Don&apos;t have a symposium account?{' '}
                  <button
                    id="switch-to-register"
                    onClick={() => setMode('register')}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              ) : (
                <p>
                  Already registered for the symposium?{' '}
                  <button
                    id="switch-to-login"
                    onClick={() => setMode('login')}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Login here
                  </button>
                </p>
              )}
            </div>
          )}

          {/* QUICK DEMO LOGIN SHORTCUTS FOR EVALUATION */}
          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 text-center space-y-3" id="demo-credentials-registry">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sandbox Fast Pass Shortcuts</span>
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2">
              <button
                id="demo-student-login-btn"
                onClick={() => handleQuickLogin('student')}
                className="px-3.5 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl transition cursor-pointer"
              >
                Demo Student Pass
              </button>
              <button
                id="demo-admin-login-btn"
                onClick={() => handleQuickLogin('admin')}
                className="px-3.5 py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl transition cursor-pointer"
              >
                Demo Admin Pass
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
