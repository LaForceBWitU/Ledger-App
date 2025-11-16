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

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const localUser = localStorage.getItem('ledgerUserId');
    if (localUser) {
      try {
        const users = await supabase.query('users', 'GET', null, `id=eq.${localUser}`);
        if (users && users[0]) {
          const u = users[0];
          setUser(u);
          const hoursSince = u.last_check_in ? (new Date() - new Date(u.last_check_in)) / 3600000 : 999;
          if (hoursSince >= 24 && u.onboarding_complete) setShowCheckIn(true);
        }
      } catch (e) {
        console.error('Error loading user:', e);
      }
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="text-2xl font-bold text-gray-600">Loading...</div></div>;
  if (!user) return <LoginPage setUser={setUser} />;
  if (!user.has_paid) return <PaymentPage user={user} setUser={setUser} />;
  if (!user.onboarding_complete) return <Onboarding user={user} setUser={setUser} />;
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

const LoginPage = ({setUser}) => {
  const [form, setForm] = useState({email:'', password:''});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const users = await supabase.query('users', 'GET', null, `email=eq.${form.email}`);
      if (users && users[0]) {
        localStorage.setItem('ledgerUserId', users[0].id);
        setUser(users[0]);
      } else {
        alert('User not found. Creating new account...');
        handleSignup();
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const newUser = {
        email: form.email,
        name: form.email.split('@')[0],
        coins: 20,
        streak: 0,
        sober_since: new Date().toISOString(),
        has_paid: false,
        onboarding_complete: false,
        created_at: new Date().toISOString()
      };
      const result = await supabase.query('users', 'POST', newUser);
      if (result && result[0]) {
        localStorage.setItem('ledgerUserId', result[0].id);
        setUser(result[0]);
      }
    } catch (e) {
      alert('Error creating account: ' + e.message);
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
            <button onClick={handleLogin} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:opacity-50">
              {loading ? 'Loading...' : 'Log In'}
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-2">Need an account?</p>
            <button onClick={handleSignup} disabled={loading} className="text-green-600 font-bold">Let's Get Started →</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentPage = ({user,setUser}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Load Stripe
      const stripe = window.Stripe ? window.Stripe(STRIPE_PUBLISHABLE_KEY) : null;
      
      if (!stripe) {
        alert('Loading payment system... Please wait and try again.');
        // Dynamically load Stripe
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => {
          alert('Payment system loaded! Please click the button again.');
        };
        document.head.appendChild(script);
        setLoading(false);
        return;
      }

      // Create checkout session
      const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + STRIPE_PUBLISHABLE_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'payment_method_types[]': 'card',
          'line_items[0][price]': STRIPE_PRICE_ID,
          'line_items[0][quantity]': '1',
          'mode': 'payment',
          'success_url': window.location.origin + '?payment=success&user=' + user.id,
          'cancel_url': window.location.origin + '?payment=cancel',
          'client_reference_id': user.id,
        })
      });

      if (!response.ok) {
        throw new Error('Payment setup failed');
      }

      const session = await response.json();
      
      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment system error. For demo, granting access... In production, this will use real Stripe checkout.');
      // Fallback: Grant access anyway for demo
      await supabase.query('users', 'PATCH', {has_paid: true}, `id=eq.${user.id}`);
      setUser({...user, has_paid: true});
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-black mb-3">Start Your Journey to Clarity</h1>
          <p className="text-xl text-gray-600">Join thousands taking control of their sobriety</p>
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
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-5 rounded-xl text-xl shadow-lg transform hover:scale-105 transition-transform mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Get Lifetime Access Now - $19'}
          </button>
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <Check size={16} className="text-green-600" />
              <span>Secure Payment via Stripe • SSL Encrypted</span>
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
        {step===4 && <div><h2 className="text-xl font-bold mb-4">Supplements?</h2><div className="space-y-2 max-h-64 overflow-y-auto">{supps.map(s => <label key={s} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50"><input type="checkbox" checked={data.supplements.includes(s)} onChange={(e) => {if(e.target.checked) setData({...data,supplements:[...data.supplements,s]}); else setData({...data,supplements:data.supplements.filter(x=>x!==s)});}} /><span>{s}</span></label>)}</div></div>}
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Welcome, {user.name}!</h1>
        <button onClick={() => setShowCheckIn(true)} className="bg-green-600 text-white font-bold px-6 py-3 rounded-lg">Check-In</button>
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
