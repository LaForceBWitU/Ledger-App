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
  const [showAssessment, setShowAssessment] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    checkUser();
    // Check URL for routing
    if (window.location.pathname === '/assessment') {
      setShowAssessment(true);
    } else if (window.location.pathname === '/about') {
      setShowAbout(true);
    }
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

  // Show about page
  if (showAbout && !user) return <AboutPage onBack={() => { setShowAbout(false); window.history.pushState({}, '', '/'); }} showLogin={() => setShowLogin(true)} showAssessment={() => { setShowAssessment(true); window.history.pushState({}, '', '/assessment'); }} />;

  // Show assessment page
  if (showAssessment && !user) return <AssessmentPage onBack={() => { setShowAssessment(false); window.history.pushState({}, '', '/'); }} showLogin={() => setShowLogin(true)} showAbout={() => { setShowAbout(true); window.history.pushState({}, '', '/about'); }} />;

  // Show login page if user explicitly wants to login
  if (showLogin && !user) return <LoginPage setUser={setUser} onBack={() => setShowLogin(false)} />;

  // Payment page is the first page (no login required)
  if (!hasPaid && !user) return <PaymentPage setHasPaid={setHasPaid} showLogin={() => setShowLogin(true)} showAssessment={() => { setShowAssessment(true); window.history.pushState({}, '', '/assessment'); }} showAbout={() => { setShowAbout(true); window.history.pushState({}, '', '/about'); }} />;

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

const PaymentPage = ({setHasPaid, showLogin, showAssessment, showAbout}) => {
  const handlePayment = () => {
    // Direct redirect to Stripe payment link
    window.location.href = 'https://buy.stripe.com/6oU6oJ88I4GtdKL6mjbsc00';
  };

  const [openFaq, setOpenFaq] = useState(null);

  const benefits = [
    {
      title: 'See Your THC and Habits in One Place',
      desc: 'Track sessions, moods, breaks, and key habits so you stop guessing and actually see patterns.'
    },
    {
      title: 'Reduce Panic and Overthinking',
      desc: 'When everything is in one place (timelines, tools, and routines), you stop spiraling through Reddit and start making clear decisions.'
    },
    {
      title: 'Built for Smokers and Resetters',
      desc: 'Whether you smoke daily, are trying to cut back, or are taking a break, the system is built around your reality, not some perfect fantasy.'
    },
    {
      title: 'A Cheap Way Into Something Serious',
      desc: 'Instead of $100+ coaching or random detox scams, this gives you a legit system for $19, once.'
    }
  ];

  const features = [
    { title: 'THC and Session Tracker', desc: 'Log your usage, breaks, and notes.' },
    { title: 'Calendar View', desc: 'See everything laid out over days and weeks.' },
    { title: 'Knowledge Store', desc: 'Quick reads about THC, resets, habits, and lifestyle.' },
    { title: 'Clarity Coins Starter Pack', desc: 'Earn and use coins in the Clarity Store.' },
    { title: 'Clarity Store Access', desc: 'Future physical and digital items tied into your system.' },
    { title: 'Community Access', desc: 'A space built for people like you.' },
    { title: 'Tool Access', desc: 'Your core calculator and tracking tools.' }
  ];

  const forYou = [
    'You smoke and want more structure, not shame.',
    'You are considering breaks or resets and want a system, not just vibes.',
    'You stress easily and want tools that calm, not hype you up.',
    'You want something cheap and honest, not a scammy detox scheme.'
  ];

  const notForYou = [
    'You want a magic guarantee about any test outcome.',
    'You want someone to tell you what to do with your health or medical decisions.',
    'You are not willing to log anything or use any tools.',
    'You just want memes and entertainment (go to YouTube for that).'
  ];

  const faqs = [
    {
      q: 'Is this a subscription?',
      a: 'No. $19 is a one-time payment for lifetime access. There are no hidden fees or recurring charges.'
    },
    {
      q: 'Do you guarantee anything about drug tests?',
      a: 'No. This is not medical or legal advice. Clarity provides tracking tools and estimates, but results vary by individual. Always consult a healthcare professional.'
    },
    {
      q: 'Is this anonymous?',
      a: 'We only collect your email for account access. Your tracking data is private and stored securely. We do not sell or share your personal information.'
    },
    {
      q: 'What happens after I pay?',
      a: 'You will create your account immediately, complete a quick onboarding to personalize your dashboard, and get instant access to all tools and features.'
    },
    {
      q: 'Can I upgrade later?',
      a: 'Yes. You can add the Personal Clarity Assessment or other offerings at any time. Your $19 access never expires.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-black">Clarity</h1>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={showAbout} className="text-gray-700 font-medium hover:text-green-600 transition-colors">About</button>
            <button onClick={showAssessment} className="text-gray-700 font-medium hover:text-green-600 transition-colors">Assessment</button>
            <button onClick={showLogin} className="text-green-600 font-semibold hover:underline">Log In</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text */}
            <div className="order-2 lg:order-1">
              <h1 className="text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
                Stop Guessing. Start Tracking Your THC and Life Clearly.
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                For $19, get lifetime access to the Clarity dashboard: track your sessions, use the THC tools, build better routines, and plug into a community built for smokers and people taking breaks.
              </p>
              <button
                onClick={handlePayment}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform hover:scale-105 transition-transform mb-4"
              >
                Get Lifetime Access for $19
              </button>
              <p className="text-sm text-gray-600 mb-6">
                One-time payment. Instant access. No hidden subscription.
              </p>
              <div className="space-y-2 text-gray-700">
                <div className="flex items-start space-x-2">
                  <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Built for smokers, resetters, and anyone wanting more control</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Includes calculator, tracker, calendar, knowledge store, and more</span>
                </div>
              </div>
            </div>
            {/* Right side - Visual */}
            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-6">
                <div className="bg-gray-100 rounded-xl p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-green-600 text-white rounded-lg p-4">
                      <p className="text-sm opacity-80">Days Sober</p>
                      <p className="text-3xl font-bold">14</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-500">Streak</p>
                        <p className="text-xl font-bold">7</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-500">Saved</p>
                        <p className="text-xl font-bold text-green-600">$140</p>
                      </div>
                    </div>
                    <div className="bg-blue-600 text-white rounded-lg p-3">
                      <p className="text-xs opacity-80">Clearance Estimate</p>
                      <p className="text-lg font-bold">~3 days remaining</p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-500">Example of the Clarity dashboard you will get access to.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Why Clarity Exists */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Why Clarity Exists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">{idx + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-black mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={handlePayment}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Get Lifetime Access for $19
            </button>
          </div>
        </div>
      </section>

      {/* Section 3 - What You Get */}
      <section className="py-16 bg-green-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">What You Get for a One-Time $19</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-gray-700 text-center">
              This $19 access is your "starter key" into the Clarity ecosystem. No monthly fees, no upsell trap. Just a cheap way to get in, use the tools, and see if this system fits your life.
            </p>
          </div>
          <div className="text-center mt-8">
            <button
              onClick={handlePayment}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Unlock Clarity for $19 (Lifetime Access)
            </button>
          </div>
        </div>
      </section>

      {/* Section 4 - Who This Is For */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Who Clarity Is For (and Who It Is Not)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For You */}
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-green-700 mb-4">This is for you if...</h3>
              <ul className="space-y-3">
                {forYou.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Not For You */}
            <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-4">This is NOT for you if...</h3>
              <ul className="space-y-3">
                {notForYou.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <X size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="text-center mt-12">
            <button
              onClick={handlePayment}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              I Am In: Give Me Lifetime Access for $19
            </button>
          </div>
        </div>
      </section>

      {/* Section 5 - Assessment Upsell */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-2xl lg:text-3xl font-bold text-center mb-4">Need More Personal Guidance?</h2>
            <p className="text-gray-600 text-center mb-8">
              Some people want more than just tools. They want their situation broken down, organized, and turned into a clear plan they can follow. For that, there is the Personal Clarity Assessment ($79).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start space-x-3">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">1-on-1 structured review of your situation based on your inputs</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">A written game plan: habits, routines, tool usage, and milestones</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Priority support for follow-up questions</span>
              </div>
              <div className="flex items-start space-x-3">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Extra Clarity Coins to use in the ecosystem</span>
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={showAssessment}
                className="inline-block border-2 border-green-600 text-green-600 font-bold py-3 px-6 rounded-xl hover:bg-green-50 transition-colors"
              >
                Learn About the Clarity Assessment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 - FAQs */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-black pr-4">{faq.q}</span>
                  <span className="text-2xl text-gray-400 flex-shrink-0">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-gray-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={handlePayment}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Get Lifetime Access for $19
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Clarity</h3>
            <p className="text-gray-400">Where Habits Turn to History</p>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <div className="bg-gray-800 rounded-xl p-6 text-sm text-gray-400">
              <p className="font-bold text-white mb-2">Disclaimer</p>
              <p>
                Clarity is an informational tool designed to help you track habits and routines. It is not medical, legal, or professional advice. All calculations and estimates are for informational purposes only and should not be relied upon for any medical decisions, drug testing outcomes, or health-related choices. Individual results vary significantly based on many factors. Clarity does not diagnose, treat, cure, or prevent any condition. Always consult qualified healthcare professionals for medical advice. By using Clarity, you acknowledge that you understand these limitations and agree to use the tools responsibly.
              </p>
            </div>
            <p className="text-center text-gray-500 text-sm mt-8">
              © {new Date().getFullYear()} Clarity. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const AssessmentPage = ({onBack, showLogin, showAbout}) => {
  const handleAssessmentPayment = () => {
    // Direct redirect to Stripe payment link for $79 assessment
    window.location.href = 'https://buy.stripe.com/fZucN7gFegpbbCDh0Xbsc01';
  };

  const [openFaq, setOpenFaq] = useState(null);

  const whyBlocks = [
    {
      title: 'You Want More Than a Tool',
      desc: 'The $19 system gives you lifetime access to the Clarity dashboard. The assessment builds a personalized plan around your actual life, habits, and timeline.'
    },
    {
      title: 'You Are Overthinking',
      desc: 'You want someone to help you organize the chaos: what matters, what does not, and how to stay steady.'
    },
    {
      title: 'You Want a Clear Direction',
      desc: 'The assessment gives you a structured plan: daily steps, weekly milestones, and lifestyle recommendations based on your inputs.'
    },
    {
      title: 'You Want Human-Level Clarity',
      desc: 'Not therapy. Not medical advice. Just clarity and structure from someone who built the entire system and knows how to apply it.'
    }
  ];

  const deliverables = [
    {
      title: 'Personalized Intake Review',
      items: [
        'Your habits and lifestyle patterns',
        'Your goals and stress points',
        'What you are trying to solve',
        'Your schedule and usage patterns',
        'Any timelines you are working around'
      ],
      desc: 'I review everything and build a plan based on YOUR inputs.'
    },
    {
      title: 'A Custom Written Plan (2 to 4 pages)',
      items: [
        'How to use the Clarity tools',
        'What routines help you',
        'Daily and weekly checklists',
        'Habit and reset structure',
        'Clarity coin strategy',
        'How to organize your dashboard',
        'A calming, actionable roadmap you can actually follow'
      ],
      desc: null
    },
    {
      title: 'Priority Messaging Access',
      items: null,
      desc: 'After the assessment, you can send questions related to your plan and get priority responses. (Not therapy. Not guaranteed 24/7. Just priority replies for clarity.)'
    },
    {
      title: 'Bonus: Lifetime Access to the Clarity Starter System ($19 Value)',
      items: [
        'Calculator',
        'Tracker',
        'Calendar',
        'Knowledge store',
        'Community',
        'Clarity store',
        'Starter coins',
        'All features included in the $19 tier'
      ],
      desc: 'The $79 includes everything in the $19, automatically.'
    },
    {
      title: 'Bonus: 2,000 Clarity Coins',
      items: null,
      desc: 'You can use these in the Clarity Store or save them for launch rewards.'
    }
  ];

  const steps = [
    {
      num: '1',
      title: 'Purchase the Assessment',
      desc: 'Instant access. You will receive your personalized intake form immediately.'
    },
    {
      num: '2',
      title: 'Fill Out Your Inputs',
      desc: 'This takes 3 to 5 minutes. You answer questions about your patterns, goals, lifestyle, and what you need clarity about.'
    },
    {
      num: '3',
      title: 'Receive Your Personalized Plan',
      desc: 'Within 24 to 48 hours, you receive your full plan: structured, organized, tailored to you, easy to follow, and designed to calm, guide, and focus you.'
    },
    {
      num: '4',
      title: 'Ask Follow-Up Questions (Optional)',
      desc: 'If you need clarity about the plan, you can ask. You get priority response.'
    }
  ];

  const forYou = [
    'You want personal guidance, not generic tips',
    'You want peace, structure, and direction',
    'You want a plan that matches your life',
    'You feel overwhelmed or unsure',
    'You want the creator of Clarity to personally break down your situation'
  ];

  const notForYou = [
    'You want medical or legal advice',
    'You want guarantees about any test',
    'You do not want to fill out the intake form',
    'You do not plan to follow a plan',
    'You are looking for therapy or mental health services'
  ];

  const comparisonRows = [
    { feature: 'Access to tools', starter: true, assessment: true },
    { feature: 'Calculator', starter: true, assessment: true },
    { feature: 'Tracker', starter: true, assessment: true },
    { feature: 'Calendar', starter: true, assessment: true },
    { feature: 'Knowledge store', starter: true, assessment: true },
    { feature: 'Community', starter: true, assessment: true },
    { feature: 'Clarity Store', starter: true, assessment: true },
    { feature: 'Starter Coins', starter: true, assessment: true },
    { feature: 'Personalized Intake Review', starter: false, assessment: true },
    { feature: 'Custom Written Plan', starter: false, assessment: true },
    { feature: 'Priority Messaging Support', starter: false, assessment: true },
    { feature: 'Personalized Recommendations', starter: false, assessment: true },
    { feature: 'Bonus Coins', starter: false, assessment: '2,000' }
  ];

  const faqs = [
    {
      q: 'Do I get all $19 features included?',
      a: 'Yes. The $79 tier includes everything from the $19 tier automatically.'
    },
    {
      q: 'Is this medical advice?',
      a: 'No. It is guidance, structure, and clarity based on the inputs you provide.'
    },
    {
      q: 'How long until I get my plan?',
      a: 'Usually 24 to 48 hours.'
    },
    {
      q: 'Do you offer refunds?',
      a: 'No, because this is personalized work.'
    },
    {
      q: 'Can I upgrade later?',
      a: 'Yes. If you bought the $19 tier, the assessment is an optional upgrade.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={onBack} className="text-2xl font-bold text-black hover:text-green-600 transition-colors">Clarity</button>
          <div className="flex items-center space-x-6">
            <button onClick={onBack} className="text-gray-700 font-medium hover:text-green-600 transition-colors">Home</button>
            <button onClick={showAbout} className="text-gray-700 font-medium hover:text-green-600 transition-colors">About</button>
            <button onClick={showLogin} className="text-green-600 font-semibold hover:underline">Log In</button>
          </div>
        </div>
      </nav>

      {/* Section 1 - Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text */}
            <div className="order-2 lg:order-1">
              <h1 className="text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
                Personalized Clarity Assessment: Built Around You
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Get a structured, 1-on-1 analysis of your situation and a personalized plan that uses the Clarity ecosystem to help you stay organized, calm, and in control.
              </p>
              <button
                onClick={handleAssessmentPayment}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform hover:scale-105 transition-transform mb-4"
              >
                Get Your Personalized Assessment: $79
              </button>
              <p className="text-sm text-gray-600 mb-6">
                Includes full lifetime access to the $19 Clarity Starter system.
              </p>
            </div>
            {/* Right side - Visual */}
            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-6">
                <div className="bg-blue-50 rounded-xl p-6 mb-4">
                  <div className="text-center mb-4">
                    <div className="inline-block bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold mb-4">Your Personalized Plan</div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 border">
                      <p className="text-xs text-gray-500 mb-1">Daily Routine</p>
                      <div className="flex space-x-2">
                        <div className="h-2 bg-blue-600 rounded flex-1"></div>
                        <div className="h-2 bg-blue-400 rounded flex-1"></div>
                        <div className="h-2 bg-blue-200 rounded flex-1"></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <p className="text-xs text-gray-500 mb-1">Weekly Milestones</p>
                      <div className="flex space-x-1">
                        {[1,2,3,4,5,6,7].map(d => (
                          <div key={d} className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${d <= 4 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{d}</div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border">
                      <p className="text-xs text-gray-500 mb-1">Personalized Recommendations</p>
                      <p className="text-sm font-medium text-gray-700">Tailored to your habits and goals</p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-gray-500">Your personalized plan is based on the inputs you provide: structured, simple, and focused on clarity.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - Why People Choose the Assessment */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Why People Get a 1-on-1 Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {whyBlocks.map((block, idx) => (
              <div key={idx} className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-lg">{idx + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-black mb-3">{block.title}</h3>
                <p className="text-gray-600">{block.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={handleAssessmentPayment}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Get the Clarity Assessment: $79
            </button>
          </div>
        </div>
      </section>

      {/* Section 3 - What You Get */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">What You Get in Your Assessment</h2>
          <div className="space-y-6">
            {deliverables.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black mb-3">{item.title}</h3>
                    {item.items && (
                      <ul className="space-y-2 mb-3">
                        {item.items.map((listItem, i) => (
                          <li key={i} className="flex items-start space-x-2">
                            <Check size={16} className="text-blue-600 flex-shrink-0 mt-1" />
                            <span className="text-gray-600">{listItem}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.desc && <p className="text-gray-700 font-medium">{item.desc}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={handleAssessmentPayment}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Get Your Personalized Assessment: $79
            </button>
          </div>
        </div>
      </section>

      {/* Section 4 - How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start space-x-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-2xl">{step.num}</span>
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-bold text-black mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={handleAssessmentPayment}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Start Your Assessment: $79
            </button>
          </div>
        </div>
      </section>

      {/* Section 5 - Who This Is For */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Is This Right for You?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For You */}
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-green-700 mb-4">This is for you if...</h3>
              <ul className="space-y-3">
                {forYou.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Not For You */}
            <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
              <h3 className="text-xl font-bold text-red-700 mb-4">This is NOT for you if...</h3>
              <ul className="space-y-3">
                {notForYou.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <X size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="text-center mt-12">
            <button
              onClick={handleAssessmentPayment}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Get Personalized Guidance: $79
            </button>
          </div>
        </div>
      </section>

      {/* Section 6 - Comparison Table */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">$19 Access vs. $79 Assessment</h2>
          <p className="text-center text-gray-600 mb-12">What is the Difference?</p>
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-100 font-bold text-center py-4">
              <div className="text-left pl-6">Feature</div>
              <div className="text-green-600">$19 Lifetime Access</div>
              <div className="text-blue-600">$79 Assessment</div>
            </div>
            {comparisonRows.map((row, idx) => (
              <div key={idx} className={`grid grid-cols-3 text-center py-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-t border-gray-100`}>
                <div className="text-left pl-6 text-gray-700">{row.feature}</div>
                <div>
                  {row.starter === true ? <Check size={20} className="text-green-600 mx-auto" /> : row.starter === false ? <X size={20} className="text-gray-300 mx-auto" /> : row.starter}
                </div>
                <div>
                  {row.assessment === true ? <Check size={20} className="text-blue-600 mx-auto" /> : row.assessment === false ? <X size={20} className="text-gray-300 mx-auto" /> : <span className="text-blue-600 font-bold">{row.assessment}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={handleAssessmentPayment}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Get the Assessment: $79
            </button>
          </div>
        </div>
      </section>

      {/* Section 7 - FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-black pr-4">{faq.q}</span>
                  <span className="text-2xl text-gray-400 flex-shrink-0">{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-gray-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 8 - Final CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Feeling Overwhelmed? Get a Custom Plan to Bring You Back to Center.
          </h2>
          <button
            onClick={handleAssessmentPayment}
            className="bg-white text-blue-600 font-bold py-4 px-10 rounded-xl text-xl shadow-lg transform hover:scale-105 transition-transform mb-4"
          >
            Start Your Assessment: $79
          </button>
          <p className="text-blue-100 text-sm">
            Full access to the Clarity Starter System included.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Clarity</h3>
            <p className="text-gray-400">Where Habits Turn to History</p>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <div className="bg-gray-800 rounded-xl p-6 text-sm text-gray-400">
              <p className="font-bold text-white mb-2">Disclaimer</p>
              <p>
                Clarity is an informational tool designed to help you track habits and routines. It is not medical, legal, or professional advice. All calculations and estimates are for informational purposes only and should not be relied upon for any medical decisions, drug testing outcomes, or health-related choices. Individual results vary significantly based on many factors. Clarity does not diagnose, treat, cure, or prevent any condition. Always consult qualified healthcare professionals for medical advice. By using Clarity, you acknowledge that you understand these limitations and agree to use the tools responsibly.
              </p>
            </div>
            <p className="text-center text-gray-500 text-sm mt-8">
              © {new Date().getFullYear()} Clarity. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const AboutPage = ({onBack, showLogin, showAssessment}) => {
  const handlePayment = () => {
    window.location.href = 'https://buy.stripe.com/6oU6oJ88I4GtdKL6mjbsc00';
  };

  const handleAssessmentPayment = () => {
    window.location.href = 'https://buy.stripe.com/fZucN7gFegpbbCDh0Xbsc01';
  };

  const problems = [
    'Every website says something different',
    'Reddit gives 1,000 answers',
    'Detox companies lie',
    'No one explains what actually matters',
    'Anxiety takes over your whole day',
    'There is no clean, structured place to track anything'
  ];

  const benefits = [
    'Track your sober days',
    'Track your patterns',
    'Understand THC more clearly',
    'Stop panicking',
    'Build new habits',
    'Follow a reset plan',
    'Stay grounded'
  ];

  const clarityIs = [
    'A sober and reset companion',
    'A structure for taking breaks',
    'A clarity-based lifestyle tool',
    'A way to understand your THC patterns',
    'A calm place to track progress',
    'A panic reducer',
    'A guided system to help you feel more in control',
    'Something built for people who want clarity'
  ];

  const clarityIsNot = [
    'A smoking community',
    'A place to share strain reviews',
    'A stoner platform',
    'Pro-marijuana content',
    'Medical advice',
    'A detox scam',
    'A "get high with me" space',
    'A chaotic forum'
  ];

  const missionPoints = [
    'Structure',
    'Awareness',
    'Calm',
    'Simplicity',
    'Consistency',
    'Personal responsibility',
    'Mental clarity'
  ];

  const starterFeatures = [
    'Full access to the Clarity dashboard',
    'The THC calculator',
    'The sober tracker',
    'The calendar',
    'Knowledge store',
    'Clarity coins',
    'The Clarity Store',
    'Everything you need to feel grounded and in control'
  ];

  const assessmentIncludes = [
    'A 1-on-1 intake review',
    'A custom sober plan',
    'Weekly milestones',
    'Daily clarity structure',
    'Priority messaging support',
    'Lifetime access to the $19 system'
  ];

  const futureTools = [
    'Craving tracker',
    'Reset challenges',
    'Panic button expansion',
    'Accountability reminders',
    'Clarity AI tools',
    'Guided clarity courses',
    'Premium tiers',
    'Sleep optimization tools',
    'Mental clarity patterns'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <button onClick={onBack} className="text-2xl font-bold text-black hover:text-green-600 transition-colors">Clarity</button>
          <div className="flex items-center space-x-6">
            <button onClick={onBack} className="text-gray-700 font-medium hover:text-green-600 transition-colors">Home</button>
            <button onClick={showAssessment} className="text-gray-700 font-medium hover:text-green-600 transition-colors">Assessment</button>
            <button onClick={showLogin} className="text-green-600 font-semibold hover:underline">Log In</button>
          </div>
        </div>
      </nav>

      {/* Section 1 - Hero */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h1 className="text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
                Clarity Exists for People Who Want Control, Not Chaos.
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Whether you are taking a break, quitting, or just need to understand how THC moves through your body, Clarity gives you structure, calm, and confidence.
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-6">
                <div className="bg-gray-100 rounded-xl p-4">
                  <div className="space-y-3">
                    <div className="bg-purple-600 text-white rounded-lg p-4">
                      <p className="text-sm opacity-80">Days Sober</p>
                      <p className="text-3xl font-bold">21</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-500">Streak</p>
                        <p className="text-xl font-bold">14</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <p className="text-xs text-gray-500">Coins</p>
                        <p className="text-xl font-bold text-purple-600">168</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 - The Real Problem */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8">THC Information Is a Mess, and People Pay the Price</h2>
          <p className="text-lg text-gray-700 mb-8 text-center">
            If you have ever tried to sober up, take a break, or figure out when THC will leave your system, you already know the problem:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {problems.map((problem, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-100">
                <X size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{problem}</span>
              </div>
            ))}
          </div>
          <div className="text-center bg-purple-50 rounded-xl p-8 border-2 border-purple-200">
            <p className="text-2xl font-bold text-purple-900 mb-3">People are not failing sobriety.</p>
            <p className="text-xl text-purple-700">They are failing bad information.</p>
            <p className="text-lg text-gray-700 mt-4">Clarity was built to fix that.</p>
          </div>
        </div>
      </section>

      {/* Section 3 - Origin Story */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8">Why I Built Clarity</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            I kept seeing the same thing online: people trying to sober up or take a break, and all they got was fear, confusion, and useless timelines. Nothing was clean. Nothing was dependable. Nothing made people feel calmer.
          </p>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            So I built Clarity: a simple, structured system that helps you:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
          <div className="text-center bg-purple-600 text-white rounded-xl p-8">
            <p className="text-2xl font-bold">I built this for people who want control, not chaos.</p>
          </div>
        </div>
      </section>

      {/* Section 4 - What Clarity Is / Is Not */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">What Clarity Is (and Is Not)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="text-2xl font-bold text-green-700 mb-6">Clarity Is:</h3>
              <ul className="space-y-3">
                {clarityIs.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
              <h3 className="text-2xl font-bold text-red-700 mb-6">Clarity Is NOT:</h3>
              <ul className="space-y-3">
                {clarityIsNot.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <X size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 - The Mission */}
      <section className="py-16 bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8">The Clarity Mission</h2>
          <p className="text-lg mb-8 text-center leading-relaxed">
            Clarity's mission is to help you regain control over your relationship with THC, whether that means taking a break, quitting, or simply feeling more confident about your timeline.
          </p>
          <p className="text-lg mb-6 text-center">
            This is a judgment-free, panic-free ecosystem built around:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {missionPoints.map((point, idx) => (
              <div key={idx} className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                <p className="font-semibold">{point}</p>
              </div>
            ))}
          </div>
          <div className="text-center bg-white bg-opacity-10 rounded-xl p-8 border border-white border-opacity-30">
            <p className="text-2xl font-bold mb-2">You do not need to be perfect.</p>
            <p className="text-xl">You just need a system.</p>
          </div>
        </div>
      </section>

      {/* Section 6 - $19 Starter Pack */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8">Start with the Clarity Starter Pack</h2>
          <p className="text-lg text-gray-700 mb-6 text-center">
            For a one-time $19 fee, you get:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {starterFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button
              onClick={handlePayment}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-xl text-xl shadow-lg transform hover:scale-105 transition-transform"
            >
              Get Lifetime Access: $19
            </button>
          </div>
        </div>
      </section>

      {/* Section 7 - $79 Assessment */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-3xl font-bold text-center mb-4">Need Personalized Guidance?</h2>
            <p className="text-lg text-gray-700 mb-6 text-center">
              If you want a structured plan tailored to your break, reset, or sobriety goals, I offer a personalized $79 assessment.
            </p>
            <p className="text-gray-600 mb-6 text-center">It includes:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {assessmentIncludes.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <Check size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={showAssessment}
                className="border-2 border-purple-600 text-purple-600 font-bold py-3 px-8 rounded-xl hover:bg-purple-50 transition-colors"
              >
                Learn About the Assessment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8 - The Future */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8">The Future of Clarity</h2>
          <p className="text-lg text-gray-700 mb-8 text-center leading-relaxed">
            Clarity will continue evolving into the most structured, supportive clarity system for anyone resetting or stepping away from THC.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {futureTools.map((tool, idx) => (
              <div key={idx} className="bg-purple-50 rounded-lg p-4 border border-purple-200 text-center">
                <p className="text-gray-700 font-medium">{tool}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9 - Emotional Closing */}
      <section className="py-20 bg-gradient-to-b from-purple-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-8">
            You Are Not Alone. You Are Not Lost. You Just Need Clarity.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handlePayment}
              className="bg-white text-purple-600 font-bold py-4 px-8 rounded-xl text-lg shadow-lg transform hover:scale-105 transition-transform"
            >
              Get Lifetime Access: $19
            </button>
            <button
              onClick={handleAssessmentPayment}
              className="border-2 border-white text-white font-bold py-4 px-8 rounded-xl hover:bg-white hover:text-purple-600 transition-colors"
            >
              View the Personalized Assessment: $79
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Clarity</h3>
            <p className="text-gray-400">Where Habits Turn to History</p>
          </div>
          <div className="border-t border-gray-700 pt-8">
            <div className="bg-gray-800 rounded-xl p-6 text-sm text-gray-400">
              <p className="font-bold text-white mb-2">Disclaimer</p>
              <p>
                Clarity is an informational tool designed to help you track habits and routines. It is not medical, legal, or professional advice. All calculations and estimates are for informational purposes only and should not be relied upon for any medical decisions, drug testing outcomes, or health-related choices. Individual results vary significantly based on many factors. Clarity does not diagnose, treat, cure, or prevent any condition. Always consult qualified healthcare professionals for medical advice. By using Clarity, you acknowledge that you understand these limitations and agree to use the tools responsibly.
              </p>
            </div>
            <p className="text-center text-gray-500 text-sm mt-8">
              © {new Date().getFullYear()} Clarity. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
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
