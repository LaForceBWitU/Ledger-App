import React, { useState, useEffect } from 'react';
import { LogOut, Menu, X, Check, Calendar, Eye } from 'lucide-react';

// Supabase Configuration
const SUPABASE_URL = 'https://aikbdtyzigeszkrozdng.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpa2JkdHl6aWdlc3prcm96ZG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMjgxNDYsImV4cCI6MjA3ODgwNDE0Nn0.fkE75HQiapzmEp1eYbm_cpN1o49t83LvZQbS-A_KXe0';

// Stripe Configuration
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51STqsFRbE7vY4nMMaORtOhfCoHrM4QwlAxqoqDdi7bQsT8GS8HVQjiLJX2x45aZvdFQIfgxk1ZWWvhxcCazifs7Z00i2uUI7W2';
const STRIPE_PRICE_ID = 'prod_TQj3o0AGvx2puO';

// Simple Supabase client
const supabase = {
  async query(table, method = 'GET', data = null, filter = null) {
    const url = `${SUPABASE_URL}/rest/v1/${table}${filter ? `?${filter}` : ''}`;
    const options = {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    if (data) options.body = JSON.stringify(data);
    const res = await fetch(url, options);
    return res.json();
  }
};

const LedgerApp = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [viewLog, setViewLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const localUser = localStorage.getItem('ledgerUserId');
    const paidStatus = localStorage.getItem('ledgerHasPaid');
    if (paidStatus === 'true') setHasPaid(true);

    if (localUser) {
      try {
        const users = await supabase.query('users', 'GET', null, `id=eq.${localUser}`);
        if (users && users[0]) {
          const u = users[0];

          // Check if user is approved
          if (!u.approved) {
            // User not approved yet - clear localStorage and don't set user
            localStorage.removeItem('ledgerUserId');
            alert('Your account is still pending approval. You will receive an email once approved.\n\nQuestions? Contact BundleUpMontana@gmail.com');
            setLoading(false);
            return;
          }

          setUser(u);
          const hoursSince = u.last_check_in ? (new Date() - new Date(u.last_check_in)) / 3600000 : 999;
          if (hoursSince >= 24 && u.onboarding_complete) setShowCheckIn(true);
        } else {
          // User ID in localStorage but not found in DB - clear it
          localStorage.removeItem('ledgerUserId');
        }
      } catch (e) {
        console.error('Error loading user:', e);
      }
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-2xl font-bold text-gray-600">Loading...</div></div>;

  // Show About page if requested
  if (showAbout) return <AboutPage onBack={() => setShowAbout(false)} />;

  // Show login page if user explicitly wants to login
  if (showLogin && !user) return <LoginPage setUser={setUser} onBack={() => setShowLogin(false)} />;

  // Payment page is the first page (no login required)
  if (!hasPaid && !user) return <PaymentPage setHasPaid={setHasPaid} showLogin={() => setShowLogin(true)} showAbout={() => setShowAbout(true)} />;

  // After payment, create account
  if (hasPaid && !user) return <CreateAccountPage setUser={setUser} />;

  // After account creation, complete onboarding
  if (user && !user.onboarding_complete) return <Onboarding user={user} setUser={setUser} />;

  // Check-in popup and log viewer
  if (showCheckIn) return <CheckInPopup user={user} setUser={setUser} onClose={() => setShowCheckIn(false)} />;
  if (viewLog) return <LogViewer log={viewLog} onClose={() => setViewLog(null)} />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-green-600 text-white rounded-lg">
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-64 h-screen bg-white border-r p-6 transition-transform z-40`}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Ledger</h1>
          <p className="text-sm text-gray-500">Where Habits Turn to History</p>
        </div>
        <nav className="space-y-2">
          <button onClick={() => setSidebarOpen(false)} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-green-600 text-white">
            <Calendar size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">Clarity Coins</p>
            <p className="text-3xl font-bold text-green-600">{user.coins} CC</p>
          </div>
          <button onClick={() => {localStorage.clear(); window.location.reload();}} className="w-full flex items-center space-x-2 text-gray-600 hover:text-black"><LogOut size={20}/><span>Logout</span></button>
        </div>
      </aside>
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <CalendarView user={user} setUser={setUser} setShowCheckIn={setShowCheckIn} setViewLog={setViewLog} />
      </main>
    </div>
  );
};

const AboutPage = ({onBack}) => {
  const handlePayment = () => {
    window.location.href = 'https://buy.stripe.com/6oU6oJ88I4GtdKL6mjbsc00';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <div className="sticky top-0 bg-white border-b-2 border-gray-200 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={onBack} className="text-green-600 font-bold hover:underline flex items-center">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Ledger</h1>
          <button onClick={handlePayment} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg">
            Get Started - $19
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* SECTION 1 - HERO SECTION */}
        <section className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-black leading-tight">
            Control Exists for People Who Want Clarity - Not Chaos
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Whether you're taking a break, quitting, or just need to understand how THC moves through your body, Ledger gives you structure, calm, and confidence.
          </p>
          <div className="mt-8 bg-gray-50 border-2 border-gray-200 rounded-xl p-8">
            <p className="text-gray-600 italic">A clean, minimal dashboard - no weed imagery, just results.</p>
          </div>
        </section>

        {/* SECTION 2 - THE REAL PROBLEM */}
        <section className="bg-white border-2 border-gray-200 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-6">THC Information Is a Mess - And People Pay the Price</h2>
          <p className="text-lg text-gray-700 mb-6">
            If you've ever tried to sober up, take a break, or figure out when THC will leave your system, you already know the problem:
          </p>
          <ul className="space-y-3 text-gray-700 mb-6">
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Every website says something different</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Reddit gives 1,000 conflicting answers</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Detox companies make false promises</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>No one explains what actually matters</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Anxiety takes over your whole day</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>There's no clean, structured place to track anything</span>
            </li>
          </ul>
          <p className="text-xl font-bold text-green-600">
            People aren't failing sobriety - they're failing from bad information.
          </p>
          <p className="text-lg text-gray-700 mt-4">
            Ledger was built to fix that.
          </p>
        </section>

        {/* SECTION 3 - THE ORIGIN STORY */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">Why I Built Ledger</h2>
          <p className="text-lg text-gray-700">
            I kept seeing the same thing online: people trying to sober up or take a break, and all they got was fear, confusion, and useless timelines. Nothing was clean. Nothing was dependable. Nothing made people feel calmer.
          </p>
          <p className="text-lg text-gray-700">
            So I built Ledger - a simple, structured system that helps you:
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Track your sober days with precision</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Understand your usage patterns</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Get clear THC clearance estimates</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Stop panicking about timelines</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Build healthier habits</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Follow a structured reset plan</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-3">•</span>
              <span>Stay grounded through your journey</span>
            </li>
          </ul>
          <p className="text-xl font-bold text-black mt-6">
            I built this for people who want control - not chaos.
          </p>
        </section>

        {/* SECTION 4 - WHAT LEDGER IS / IS NOT */}
        <section className="bg-green-50 border-2 border-green-600 rounded-xl p-8 space-y-6">
          <h2 className="text-3xl font-bold">What Ledger Is (And Isn't)</h2>

          <div>
            <h3 className="text-2xl font-bold text-green-600 mb-4">Ledger Is:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>A sobriety and reset companion</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>A structured system for taking breaks</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>A clarity-based lifestyle tool</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>A way to understand your THC patterns</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>A calm place to track progress</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>A panic reducer</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>A guided system to help you feel more in control</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">✓</span>
                <span>Built for people who want clarity</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">Ledger Is Not:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✗</span>
                <span>A smoking community</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✗</span>
                <span>A place to share strain reviews</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✗</span>
                <span>A stoner platform</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✗</span>
                <span>Pro-marijuana content</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✗</span>
                <span>Medical advice</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✗</span>
                <span>A detox scam</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✗</span>
                <span>A "get high with me" space</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-3">✗</span>
                <span>A chaotic forum</span>
              </li>
            </ul>
          </div>
        </section>

        {/* SECTION 5 - THE MISSION */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">The Ledger Mission</h2>
          <p className="text-lg text-gray-700">
            Ledger's mission is to help you regain control over your relationship with THC - whether that means taking a break, quitting, or simply feeling more confident about your clearance timeline.
          </p>
          <p className="text-lg text-gray-700">
            This is a judgment-free, panic-free ecosystem built around:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Structure', 'Awareness', 'Calm', 'Simplicity', 'Consistency', 'Personal Responsibility', 'Mental Clarity', 'Progress'].map(item => (
              <div key={item} className="bg-green-600 text-white rounded-lg p-4 text-center font-bold">
                {item}
              </div>
            ))}
          </div>
          <p className="text-xl font-bold text-black mt-6">
            You don't need to be perfect. You just need a system.
          </p>
        </section>

        {/* SECTION 6 - $19 TIER */}
        <section className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-8 space-y-6">
          <h2 className="text-3xl font-bold">Start with Ledger</h2>
          <p className="text-lg">
            For a one-time $19 fee, you get lifetime access to:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Full access to the clarity dashboard',
              'The THC calculator (LUCE algorithm)',
              'The sober tracker',
              'Visual calendar with progress',
              'Knowledge store',
              'Clarity coins (gamification)',
              'The Clarity Store',
              'Everything you need to feel grounded and in control'
            ].map(item => (
              <div key={item} className="flex items-start space-x-3">
                <Check size={20} className="flex-shrink-0 mt-1" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handlePayment}
            className="w-full bg-white text-green-600 hover:bg-gray-100 font-bold py-4 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-transform"
          >
            Get Lifetime Access - $19
          </button>
        </section>

        {/* SECTION 7 - THE FUTURE */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold">The Future of Ledger</h2>
          <p className="text-lg text-gray-700">
            Ledger will continue evolving into the most structured, supportive clarity system for anyone resetting or stepping away from THC.
          </p>
          <p className="text-lg text-gray-700 font-semibold">Coming soon:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Craving tracker',
              'Reset challenges',
              'Panic button expansion',
              'Accountability reminders',
              'Clarity AI tools',
              'Guided clarity courses',
              'Premium tiers',
              'Sleep optimization tools',
              'Mental clarity patterns'
            ].map(item => (
              <div key={item} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center text-gray-700">
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 8 - ENDING EMOTIONAL PUNCH */}
        <section className="bg-black text-white rounded-xl p-12 text-center space-y-6">
          <h2 className="text-4xl font-bold">
            You're Not Alone. You're Not Lost. You Just Need Ledger.
          </h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
            <button
              onClick={handlePayment}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Get Lifetime Access - $19
            </button>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-gray-700">
          <p>
            <strong>Disclaimer:</strong> Ledger is an informational tool, not medical advice. Calculations are estimates based on scientific models. Ledger does not diagnose, treat, or cure any condition. Consult healthcare professionals for medical guidance.
          </p>
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({setUser, onBack}) => {
  const [form, setForm] = useState({email:'', password:''});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      alert('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const users = await supabase.query('users', 'GET', null, `email=eq.${form.email}`);
      if (users && users[0]) {
        const user = users[0];

        // Validate password using bcrypt
        const verifyResponse = await fetch('/api/auth/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: form.password,
            hashedPassword: user.password
          })
        });

        if (!verifyResponse.ok) {
          throw new Error('Password verification failed');
        }

        const { isMatch } = await verifyResponse.json();

        if (isMatch) {
          // Check if user is approved
          if (!user.approved) {
            alert('Your account is pending approval. You will receive an email once approved (usually within 24 hours).\n\nQuestions? Contact BundleUpMontana@gmail.com');
            setLoading(false);
            return;
          }

          localStorage.setItem('ledgerUserId', user.id);
          setUser(user);
        } else {
          alert('Incorrect password');
        }
      } else {
        alert('User not found. Please check your email or create a new account.');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3">Ledger</h1>
          <p className="text-lg text-gray-600">Where Habits Turn to History</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Log In</h2>
          <div className="space-y-4">
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} className="w-full px-4 py-3 border-2 rounded-lg focus:border-green-600 focus:outline-none" />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} className="w-full px-4 py-3 border-2 rounded-lg focus:border-green-600 focus:outline-none" />
            <button onClick={handleLogin} disabled={loading || !form.email || !form.password} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50">
              {loading ? 'Loading...' : 'Log In'}
            </button>
          </div>
          <div className="mt-6 text-center">
            <button onClick={onBack} className="text-gray-600 hover:text-black">← Back to Payment</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentPage = ({setHasPaid, showLogin, showAbout}) => {
  const handlePayment = () => {
    // Direct redirect to Stripe payment link
    window.location.href = 'https://buy.stripe.com/6oU6oJ88I4GtdKL6mjbsc00';
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-black mb-3">Start Your Journey to Clarity</h1>
          <p className="text-xl text-gray-600">Join thousands taking control of their sobriety</p>
          <button onClick={showAbout} className="mt-3 text-green-600 font-semibold hover:underline">
            Learn More About Ledger →
          </button>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-2xl">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-8 mb-8">
            <div className="text-center">
              <p className="text-lg mb-2 opacity-90">One-Time Investment</p>
              <div className="text-6xl font-bold mb-2">$19</div>
              <p className="text-green-100">Lifetime Access • No Subscriptions</p>
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-black mb-6 text-center">Everything You Need to Succeed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {title: 'Scientific Calculator', desc: 'LUCE algorithm predicts your clearance timeline'},
                {title: 'Smart Tracking', desc: 'Daily check-ins that adapt to your progress'},
                {title: 'Visual Progress', desc: 'Calendar showing your journey and savings'},
                {title: 'Gamified System', desc: 'Earn Clarity Coins for staying committed'},
                {title: 'Money Tracker', desc: 'See exactly how much you\'re saving daily'},
                {title: '20 CC Bonus', desc: 'Start with coins to explore the platform'}
              ].map(item => (
                <div key={item.title} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-black">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handlePayment}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl text-xl shadow-lg transform hover:scale-105 transition-transform mb-6"
          >
            Get Lifetime Access Now - $19
          </button>
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Check size={16} className="text-green-600" />
              <span>Secure Payment via Stripe • SSL Encrypted</span>
            </div>
            <div className="text-center mt-4">
              <p className="text-gray-600 text-sm mb-2">Already have an account?</p>
              <button onClick={showLogin} className="text-green-600 font-bold hover:underline">Log In →</button>
            </div>
            <div className="bg-green-50 border-2 border-green-600 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">✓</span>
                <div>
                  <p className="font-bold text-black mb-2">7-Day Money-Back Guarantee</p>
                  <p className="text-sm text-gray-700">Not satisfied? Get a full refund within 7 business days, no questions asked. Contact us Monday-Saturday, 10am-6pm Pacific Time.</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
              <p className="text-gray-600"><strong>Disclaimer:</strong> Ledger is an informational tool, not medical advice. Calculations are estimates. Does not diagnose, treat, or cure. Consult healthcare professionals.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateAccountPage = ({setUser}) => {
  const [form, setForm] = useState({email:'', password:'', confirmPassword:''});
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const handleSignup = async () => {
    if (!form.email || !form.password || !form.confirmPassword) {
      alert('Please fill in all fields');
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Check if user already exists
      const existingUsers = await supabase.query('users', 'GET', null, `email=eq.${form.email}`);
      if (existingUsers && existingUsers.length > 0) {
        alert('An account with this email already exists. Please login instead.');
        setLoading(false);
        return;
      }

      // Hash password via API
      const hashResponse = await fetch('/api/auth/hash-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: form.password })
      });

      if (!hashResponse.ok) {
        throw new Error('Failed to secure password');
      }

      const { hashedPassword } = await hashResponse.json();

      // Create new user with approval pending
      const newUser = {
        email: form.email,
        password: hashedPassword,
        name: form.email.split('@')[0],
        coins: 20,
        streak: 0,
        sober_since: new Date().toISOString(),
        has_paid: true,
        approved: false,
        approved_at: null,
        onboarding_complete: false,
        created_at: new Date().toISOString()
      };

      const result = await supabase.query('users', 'POST', newUser);
      if (result && result[0]) {
        const userId = result[0].id;
        const userName = result[0].name;
        const userEmail = result[0].email;

        // Send owner notification email
        try {
          await fetch('/api/notify-owner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail, userName, userId })
          });
        } catch (emailError) {
          console.error('Failed to send notification:', emailError);
          // Continue even if email fails
        }

        localStorage.removeItem('ledgerHasPaid'); // Clean up payment flag
        setPendingApproval(true);
      }
    } catch (e) {
      alert('Error creating account: ' + e.message);
    }
    setLoading(false);
  };

  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-3">Ledger</h1>
            <p className="text-lg text-gray-600">Where Habits Turn to History</p>
          </div>
          <div className="bg-green-50 border-2 border-green-600 rounded-xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
              <p className="text-gray-700">Your account is pending approval.</p>
            </div>
            <div className="bg-white border border-green-300 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Next Steps:</strong><br/>
                1. You'll receive a confirmation email shortly<br/>
                2. The owner will review your account<br/>
                3. Once approved, you'll get an email with access<br/>
                4. This usually takes less than 24 hours
              </p>
            </div>
            <p className="text-xs text-gray-600 text-center">
              Questions? Contact BundleUpMontana@gmail.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3">Ledger</h1>
          <p className="text-lg text-gray-600">Where Habits Turn to History</p>
        </div>
        <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
          <p className="text-gray-600 mb-6 text-sm">Let's get started on your journey!</p>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({...form,email:e.target.value})}
              className="w-full px-4 py-3 border-2 rounded-lg focus:border-green-600 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={form.password}
              onChange={(e) => setForm({...form,password:e.target.value})}
              className="w-full px-4 py-3 border-2 rounded-lg focus:border-green-600 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={(e) => setForm({...form,confirmPassword:e.target.value})}
              className="w-full px-4 py-3 border-2 rounded-lg focus:border-green-600 focus:outline-none"
            />
            <button
              onClick={handleSignup}
              disabled={loading || !form.email || !form.password || !form.confirmPassword}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Onboarding = ({user,setUser}) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({age:25,yearsUsing:1,freq:7,method:'smoke',amount:1,spending:300});

  const handleComplete = async () => {
    try {
      await supabase.query('users', 'PATCH', {
        onboarding_data: data,
        onboarding_complete: true
      }, `id=eq.${user.id}`);
      setUser({...user, onboarding_data: data, onboarding_complete: true});
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-4">Setup</h1>
        <div className="flex justify-center space-x-2 mb-8">{[1,2,3,4,5,6].map(s => <div key={s} className={`h-2 w-12 rounded-full ${s<=step?'bg-green-600':'bg-gray-200'}`} />)}</div>
        <div className="bg-white border-2 rounded-xl p-8 shadow-lg">
          {step===1 && <div><h2 className="text-2xl font-bold mb-4">Age?</h2><input type="number" value={data.age} onChange={(e) => setData({...data,age:Number(e.target.value)})} className="w-full px-4 py-3 border-2 rounded-lg text-xl focus:border-green-600 focus:outline-none" /></div>}
          {step===2 && <div><h2 className="text-2xl font-bold mb-4">Years using?</h2><input type="number" step="0.5" value={data.yearsUsing} onChange={(e) => setData({...data,yearsUsing:Number(e.target.value)})} className="w-full px-4 py-3 border-2 rounded-lg text-xl focus:border-green-600 focus:outline-none" /></div>}
          {step===3 && <div><h2 className="text-2xl font-bold mb-4">Days per week?</h2><div className="space-y-3">{[1,2,3,4,5,6,7].map(f => <button key={f} onClick={() => setData({...data,freq:f})} className={`w-full p-4 rounded-lg border-2 ${data.freq===f?'border-green-600 bg-green-50':'border-gray-200'}`}>{f}/week</button>)}</div></div>}
          {step===4 && <div><h2 className="text-2xl font-bold mb-4">Method?</h2>{[{v:'smoke',t:'Smoke/Vape'},{v:'edible',t:'Edibles'}].map(o => <button key={o.v} onClick={() => setData({...data,method:o.v})} className={`w-full p-6 rounded-lg border-2 mb-3 ${data.method===o.v?'border-green-600 bg-green-50':'border-gray-200'}`}><div className="font-bold text-lg">{o.t}</div></button>)}</div>}
          {step===5 && <div><h2 className="text-2xl font-bold mb-4">Grams/day?</h2><input type="number" step="0.1" value={data.amount} onChange={(e) => setData({...data,amount:Number(e.target.value)})} className="w-full px-4 py-3 border-2 rounded-lg text-xl focus:border-green-600 focus:outline-none" /></div>}
          {step===6 && <div><h2 className="text-2xl font-bold mb-4">Monthly spending?</h2><div className="relative"><span className="absolute left-4 top-3 text-2xl text-gray-500">$</span><input type="number" value={data.spending} onChange={(e) => setData({...data,spending:Number(e.target.value)})} className="w-full pl-10 pr-4 py-3 border-2 rounded-lg text-xl focus:border-green-600 focus:outline-none" /></div></div>}
          <div className="flex space-x-4 mt-8">
            {step>1 && <button onClick={() => setStep(step-1)} className="flex-1 py-3 border-2 rounded-lg font-bold">Back</button>}
            <button onClick={() => step===6 ? handleComplete() : setStep(step+1)} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg">{step===6?'Complete':'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckInPopup = ({user,setUser,onClose}) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({activity:0,weight:150,drankAlcohol:false,alcoholType:'',alcoholCount:0,supplements:[],drankCoffee:false,coffeeType:'',coffeeCount:0,usedNicotine:false,nicotineType:'',nicotineAmount:0,sleep:1,sleepHrs:8,feeling:'good',sickness:''});
  const supps = ['Multivitamin','Vitamin D','Vitamin C','B Complex','Omega-3','Magnesium','Zinc','Protein','Creatine','Pre-Workout'];
  const sickList = ['None','Cold','Flu','Fever','Headache','Stomach','Allergies','Other'];

  const complete = async () => {
    try {
      await supabase.query('daily_logs', 'POST', {
        user_id: user.id,
        log_date: new Date().toISOString(),
        log_data: data
      });
      await supabase.query('users', 'PATCH', {
        coins: user.coins + 12,
        streak: user.streak + 1,
        last_check_in: new Date().toISOString()
      }, `id=eq.${user.id}`);
      setUser({...user, coins: user.coins + 12, streak: user.streak + 1});
      setStep(100);
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  if (step===100) return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"><div className="bg-green-600 text-white rounded-xl p-12 text-center"><div className="text-7xl mb-6">🎉</div><h2 className="text-3xl font-bold mb-3">Complete!</h2><p className="text-xl mb-2">+12 CC</p><button onClick={onClose} className="mt-8 bg-white text-green-600 px-6 py-3 rounded-lg font-bold">Continue</button></div></div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full my-8">
        <h1 className="text-3xl font-bold mb-2">Daily Check-In</h1>
        <p className="text-gray-600 mb-6">Earn 12 CC</p>
        <div className="flex space-x-1 mb-8">{[1,2,3,4,5,6,7,8,9].map(s => <div key={s} className={`h-2 flex-1 rounded-full ${s<=step?'bg-green-600':'bg-gray-200'}`} />)}</div>
        
        {step===1 && <div><h2 className="text-xl font-bold mb-4">Activity?</h2>{[{v:1,t:'High'},{v:0,t:'Avg'},{v:-1,t:'Low'}].map(o => <button key={o.v} onClick={() => setData({...data,activity:o.v})} className={`w-full p-3 mb-2 rounded-lg border-2 ${data.activity===o.v?'border-green-600 bg-green-50':'border-gray-200'}`}>{o.t}</button>)}</div>}
        {step===2 && <div><h2 className="text-xl font-bold mb-4">Weight (lbs)?</h2><input type="number" value={data.weight} onChange={(e) => setData({...data,weight:Number(e.target.value)})} className="w-full p-3 border-2 rounded-lg text-xl focus:border-green-600 focus:outline-none" /></div>}
        {step===3 && <div><h2 className="text-xl font-bold mb-4">Alcohol?</h2>{[{v:true,t:'Yes'},{v:false,t:'No'}].map(o => <button key={String(o.v)} onClick={() => setData({...data,drankAlcohol:o.v})} className={`w-full p-3 mb-2 rounded-lg border-2 ${data.drankAlcohol===o.v?'border-green-600 bg-green-50':'border-gray-200'}`}>{o.t}</button>)}{data.drankAlcohol && <div className="mt-4 space-y-3"><select value={data.alcoholType} onChange={(e) => setData({...data,alcoholType:e.target.value})} className="w-full p-3 border-2 rounded-lg"><option value="">Type</option>{['Beer','Wine','Liquor','Mixed'].map(t => <option key={t}>{t}</option>)}</select><input type="number" value={data.alcoholCount} onChange={(e) => setData({...data,alcoholCount:Number(e.target.value)})} placeholder="# drinks" className="w-full p-3 border-2 rounded-lg" /></div>}</div>}
        {step===4 && <div><h2 className="text-xl font-bold mb-4">Supplements?</h2><button onClick={() => setData({...data,supplements:[]})} className={`w-full p-3 mb-3 rounded-lg border-2 font-bold ${data.supplements.length===0?'border-green-600 bg-green-50':'border-gray-200 hover:bg-gray-50'}`}>None</button><div className="space-y-2 max-h-64 overflow-y-auto">{supps.map(s => <label key={s} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50"><input type="checkbox" checked={data.supplements.includes(s)} onChange={(e) => {if(e.target.checked) setData({...data,supplements:[...data.supplements,s]}); else setData({...data,supplements:data.supplements.filter(x=>x!==s)});}} /><span>{s}</span></label>)}</div></div>}
        {step===5 && <div><h2 className="text-xl font-bold mb-4">Coffee?</h2>{[{v:true,t:'Yes'},{v:false,t:'No'}].map(o => <button key={String(o.v)} onClick={() => setData({...data,drankCoffee:o.v})} className={`w-full p-3 mb-2 rounded-lg border-2 ${data.drankCoffee===o.v?'border-green-600 bg-green-50':'border-gray-200'}`}>{o.t}</button>)}{data.drankCoffee && <div className="mt-4 space-y-3"><select value={data.coffeeType} onChange={(e) => setData({...data,coffeeType:e.target.value})} className="w-full p-3 border-2 rounded-lg"><option value="">Type</option>{['Coffee','Espresso','Energy','Tea','Soda'].map(t => <option key={t}>{t}</option>)}</select><input type="number" value={data.coffeeCount} onChange={(e) => setData({...data,coffeeCount:Number(e.target.value)})} placeholder="# servings" className="w-full p-3 border-2 rounded-lg" /></div>}</div>}
        {step===6 && <div><h2 className="text-xl font-bold mb-4">Nicotine?</h2>{[{v:true,t:'Yes'},{v:false,t:'No'}].map(o => <button key={String(o.v)} onClick={() => setData({...data,usedNicotine:o.v})} className={`w-full p-3 mb-2 rounded-lg border-2 ${data.usedNicotine===o.v?'border-green-600 bg-green-50':'border-gray-200'}`}>{o.t}</button>)}{data.usedNicotine && <div className="mt-4 space-y-3"><select value={data.nicotineType} onChange={(e) => setData({...data,nicotineType:e.target.value})} className="w-full p-3 border-2 rounded-lg"><option value="">Type</option>{['Cigarettes','Vape','Pouches','Gum','Patch'].map(t => <option key={t}>{t}</option>)}</select><input type="number" value={data.nicotineAmount} onChange={(e) => setData({...data,nicotineAmount:Number(e.target.value)})} placeholder="Amount" className="w-full p-3 border-2 rounded-lg" /></div>}</div>}
        {step===7 && <div><h2 className="text-xl font-bold mb-4">Sleep quality?</h2>{[{v:1,t:'Good'},{v:0,t:'Poor'}].map(o => <button key={o.v} onClick={() => setData({...data,sleep:o.v})} className={`w-full p-3 mb-2 rounded-lg border-2 ${data.sleep===o.v?'border-green-600 bg-green-50':'border-gray-200'}`}>{o.t}</button>)}</div>}
        {step===8 && <div><h2 className="text-xl font-bold mb-4">Hours slept?</h2><input type="number" step="0.5" value={data.sleepHrs} onChange={(e) => setData({...data,sleepHrs:Number(e.target.value)})} className="w-full p-3 border-2 rounded-lg text-xl focus:border-green-600 focus:outline-none" /></div>}
        {step===9 && <div><h2 className="text-xl font-bold mb-4">Feeling?</h2>{[{v:'good',t:'Good'},{v:'average',t:'Average'},{v:'sick',t:'Sick'}].map(o => <button key={o.v} onClick={() => setData({...data,feeling:o.v})} className={`w-full p-3 mb-2 rounded-lg border-2 ${data.feeling===o.v?'border-green-600 bg-green-50':'border-gray-200'}`}>{o.t}</button>)}{data.feeling==='sick' && <select value={data.sickness} onChange={(e) => setData({...data,sickness:e.target.value})} className="w-full p-3 border-2 rounded-lg mt-3"><option value="">Select</option>{sickList.map(s => <option key={s}>{s}</option>)}</select>}</div>}
        
        <div className="flex space-x-4 mt-8">
          {step>1 && <button onClick={() => setStep(step-1)} className="flex-1 py-3 border-2 rounded-lg font-bold">Back</button>}
          <button onClick={() => step===9?complete():setStep(step+1)} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg">{step===9?'Done':'Next'}</button>
        </div>
      </div>
    </div>
  );
};

const LogViewer = ({log,onClose}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">{new Date(log.log_date).toLocaleDateString()}</h2>
      <div className="space-y-3 text-sm">
        <p><strong>Activity:</strong> {log.log_data.activity===1?'High':log.log_data.activity===0?'Avg':'Low'}</p>
        <p><strong>Weight:</strong> {log.log_data.weight} lbs</p>
        <p><strong>Alcohol:</strong> {log.log_data.drankAlcohol?`Yes - ${log.log_data.alcoholType} (${log.log_data.alcoholCount})`:'No'}</p>
        <p><strong>Supplements:</strong> {log.log_data.supplements.join(', ')||'None'}</p>
        <p><strong>Coffee:</strong> {log.log_data.drankCoffee?`Yes - ${log.log_data.coffeeType}`:'No'}</p>
        <p><strong>Nicotine:</strong> {log.log_data.usedNicotine?`Yes - ${log.log_data.nicotineType}`:'No'}</p>
        <p><strong>Sleep:</strong> {log.log_data.sleep===1?'Good':'Poor'} ({log.log_data.sleepHrs} hrs)</p>
        <p><strong>Feeling:</strong> {log.log_data.feeling}</p>
      </div>
      <button onClick={onClose} className="mt-6 w-full bg-green-600 text-white font-bold py-3 rounded-lg">Close</button>
    </div>
  </div>
);

const CalendarView = ({user,setUser,setShowCheckIn,setViewLog}) => {
  const [month, setMonth] = useState(new Date());
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    loadLogs();
  }, [user.id]);

  const loadLogs = async () => {
    try {
      const result = await supabase.query('daily_logs', 'GET', null, `user_id=eq.${user.id}`);
      setLogs(result || []);
    } catch (e) {
      console.error('Error loading logs:', e);
    }
  };

  const days = Math.floor((Date.now()-new Date(user.sober_since))/86400000);
  const daily = (user.onboarding_data?.spending||300)/30;
  const saved = days*daily;
  const getDays = () => {const y=month.getFullYear(),m=month.getMonth(); return {total:new Date(y,m+1,0).getDate(),start:new Date(y,m,1).getDay()};};
  const {total,start} = getDays();
  
  const getLog = (d) => logs.find(l => {const ld=new Date(l.log_date); return ld.getDate()===d && ld.getMonth()===month.getMonth();});

  const calcClearance = () => {
    const onb = user.onboarding_data||{};
    const latestLog = logs[logs.length-1];
    const weightKg = latestLog?.log_data?.weight ? latestLog.log_data.weight * 0.453592 : 70;
    const tBase = (onb.amount || 1) * 1000 * 0.4;
    const modChronic = onb.yearsUsing >= 5 ? 3.0 : onb.yearsUsing >= 2 ? 2.0 : onb.freq >= 6 ? 1.5 : 1.3;
    const vdMod = weightKg < 60 ? 0.9 : weightKg < 90 ? 1.0 : 1.1;
    const aRate = onb.method === 'edible' ? 3 : 1;
    
    let sCL = 0;
    if (latestLog?.log_data) {
      const d = latestLog.log_data;
      sCL += d.activity === 1 ? 2 : d.activity === 0 ? 0 : -1;
      sCL += d.drankAlcohol ? -1 : 0;
      sCL += d.drankCoffee ? 1 : 0;
      sCL += d.usedNicotine ? 1 : 0;
      sCL += d.sleep === 1 ? 1 : -1;
      sCL += d.feeling === 'sick' ? -2 : d.feeling === 'good' ? 1 : 0;
    }
    
    const clMetabolism = Math.max(0.5, 1 + (sCL / 10));
    const tClearanceHours = (tBase * modChronic * vdMod * aRate) / clMetabolism;
    const tClearanceDays = tClearanceHours / 24;
    const remaining = Math.max(0, tClearanceDays - days);
    
    return {
      total: tClearanceDays.toFixed(1),
      remaining: remaining.toFixed(1),
      cleared: remaining <= 0,
      sCL: sCL.toFixed(1),
      clMetabolism: clMetabolism.toFixed(2)
    };
  };

  const clearance = calcClearance();

  // Calculate hours since last check-in
  const hoursSinceCheckIn = user.last_check_in ? (new Date() - new Date(user.last_check_in)) / 3600000 : 999;
  const canCheckIn = hoursSinceCheckIn >= 24;
  const hoursRemaining = canCheckIn ? 0 : Math.ceil(24 - hoursSinceCheckIn);

  const handleCheckInClick = () => {
    if (!canCheckIn) {
      alert(`You can check in again in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}. Daily check-ins are only available once every 24 hours.`);
      return;
    }
    setShowCheckIn(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Welcome, {user.name}!</h1>
        <button
          onClick={handleCheckInClick}
          className={`${canCheckIn ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white font-bold px-6 py-3 rounded-lg transition-colors`}
          title={canCheckIn ? 'Check in now' : `Available in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`}
        >
          {canCheckIn ? 'Check-In' : `Check-In (${hoursRemaining}h)`}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-600 text-white rounded-xl p-6"><p className="text-sm mb-1">Days Sober</p><p className="text-5xl font-bold">{days}</p></div>
        <div className="bg-white border-2 border-green-600 rounded-xl p-6"><p className="text-sm text-gray-600 mb-1">Streak</p><p className="text-5xl font-bold">{user.streak}</p></div>
        <div className="bg-white border-2 border-green-600 rounded-xl p-6"><p className="text-sm text-gray-600 mb-1">Saved</p><p className="text-5xl font-bold text-green-600">${saved.toFixed(0)}</p></div>
      </div>

      <div className={`${clearance.cleared?'bg-green-600':'bg-blue-600'} text-white rounded-xl p-6 mb-8`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Clearance Estimate</h2>
            <p className="text-sm opacity-90">Updated with latest check-in</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{clearance.total} days</div>
            <p className="text-lg mt-1">{clearance.cleared ? 'Clear! 🎉' : `~${clearance.remaining} days left`}</p>
          </div>
        </div>
        <div className="text-xs mt-4 p-3 bg-white bg-opacity-20 rounded-lg">⚠️ Estimate only. Not medical advice. Consult professionals.</div>
      </div>

      <div className="bg-white border-2 rounded-xl p-6">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">{month.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h2>
          <div className="flex space-x-2">
            <button onClick={() => {const n=new Date(month); n.setMonth(n.getMonth()-1); setMonth(n);}} className="px-4 py-2 border-2 rounded-lg font-bold">←</button>
            <button onClick={() => {const n=new Date(month); n.setMonth(n.getMonth()+1); setMonth(n);}} className="px-4 py-2 border-2 rounded-lg font-bold">→</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center font-bold text-gray-600 text-sm py-2">{d}</div>)}
          {Array.from({length:start}).map((_,i) => <div key={`e${i}`} />)}
          {Array.from({length:total}).map((_,i) => {
            const d=i+1;
            const dayDate = new Date(month.getFullYear(),month.getMonth(),d);
            const isSober = dayDate >= new Date(user.sober_since);
            const log = getLog(d);
            return <div key={d} onClick={() => log && setViewLog(log)} className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 ${isSober?log?'bg-green-600 text-white font-bold cursor-pointer':'bg-green-100 border-green-300':'border-gray-200 text-gray-400'}`}><span className="text-lg">{d}</span>{isSober && <span className="text-xs">${daily.toFixed(0)}</span>}{log && <Eye size={12} className="mt-1" />}</div>;
          })}
        </div>
      </div>
    </div>
  );
};

export default LedgerApp;
