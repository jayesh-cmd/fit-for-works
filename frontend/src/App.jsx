import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Bot,
  ChevronRight,
  UploadCloud,
  X,
  CheckCircle2,
  Code2,
  Briefcase,
  Palette,
  Target,
  ArrowRight,
  ArrowLeft,
  GitMerge,
  Search,
  Sparkles,
  Cpu,
  Fingerprint,
  GraduationCap,
  Menu,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Check,
  Zap,
  Rocket,
  Shield,
  LogOut,
  User,
  Download,
  FileText,
  ExternalLink,
  Github,
  Linkedin,
  Youtube
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabase';
import { Analytics } from "@vercel/analytics/react"

// --- GLOBAL STYLES & FONTS ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: #ffffff;
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(120, 119, 198, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 10%, rgba(0, 0, 0, 0.02) 0%, transparent 20%);
      color: #18181b;
      -webkit-font-smoothing: antialiased;
    }

    .glass-panel {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
    }

    .glass-card-hover:hover {
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(0, 0, 0, 0.1);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
    }
    
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);

const cn = (...classes) => classes.filter(Boolean).join(" ");

// --- UI COMPONENTS ---

const Card = ({ className, children, onClick }) => (
  <div
    onClick={onClick}
    className={cn(
      "glass-panel rounded-2xl transition-all duration-300 relative overflow-hidden group",
      onClick && "cursor-pointer glass-card-hover",
      className
    )}
  >
    {children}
  </div>
);

const CardHeader = ({ className, children }) => (
  <div className={cn("flex flex-col space-y-2 p-6 md:p-8", className)}>{children}</div>
);

const CardTitle = ({ className, children }) => (
  <h3 className={cn("text-lg md:text-xl font-bold tracking-tight text-zinc-900", className)}>{children}</h3>
);

const CardContent = ({ className, children }) => (
  <div className={cn("p-6 md:p-8 pt-0 relative z-10", className)}>{children}</div>
);

const Button = ({ className, variant = "default", size = "default", children, onClick, disabled }) => {
  const variants = {
    default: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/10 border border-transparent",
    outline: "border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 bg-transparent",
    ghost: "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900",
    glow: "bg-[#3C82F6] text-white hover:bg-[#2563EB] shadow-lg shadow-blue-500/20 border border-blue-600/10",
  };
  const sizes = {
    default: "h-10 px-5 py-2",
    sm: "h-8 rounded-lg px-3 text-xs",
    lg: "h-12 rounded-xl px-8 text-[15px]",
    icon: "h-10 w-10",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className, variant = 'default' }) => {
  const variants = {
    default: "border-zinc-200 bg-white text-zinc-500",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
  }
  return (
    <div className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium shadow-sm", variants[variant], className)}>
      {children}
    </div>
  );
};

// --- DATA & CONSTANTS ---

const MOCK_ANALYSIS_RESULT = {
  score: 72,
  potentialScore: 94,
  summary: "Strong technical foundation, but lacks quantifiable impact in experience sections.",
  critical: [
    "Summary section is missing specific role keywords.",
    "Work experience lacks numerical results (e.g., 'Increased efficiency by 20%').",
    "Formatting inconsistences detected in the Education section."
  ],
  improvements: [
    "Standardize date formats to 'Month Year'.",
    "Add a 'Skills' section header for better parsing.",
    "Include link to LinkedIn profile."
  ],
  keywords: ["React", "JavaScript", "CSS", "Frontend"]
};

const MOCK_JD_MATCH_RESULT = {
  matchScore: 65,
  potentialScore: 88,
  missingKeywords: ["TypeScript", "AWS", "GraphQL", "CI/CD", "Unit Testing"],
  matchingKeywords: ["React", "Tailwind CSS", "Git", "Agile", "Teamwork"],
  recommendation: "Your experience aligns with the core role, but specific backend and cloud skills required by this JD are missing from your text."
};

const CATEGORIES = [
  { id: 'Software Engineering', label: 'Software Engineering', icon: Code2 },
  { id: 'Business & Finance', label: 'Business & Finance', icon: Briefcase },
  { id: 'Design & Creative', label: 'Design & Creative', icon: Palette },
  { id: 'Marketing & Comms', label: 'Marketing & Comms', icon: Target },
  { id: 'Education & Research', label: 'Education & Research', icon: GraduationCap }
];

const ROLES = {
  'Software Engineering': ['General Software Engineering', 'Frontend Engineering', 'Mobile Engineering', 'DevOps Engineering', 'Backend Engineering', 'Full-Stack Engineering', 'Data Engineering', 'ML/AI Engineering'],
  'Business & Finance': ['Financial Analyst', 'Accountant', 'Investment Banker', 'Business Analyst'],
  'Design & Creative': ['Product Designer', 'Graphic Designer', 'UX Researcher', 'Art Director'],
  'Marketing & Comms': ['Marketing Manager', 'Content Strategist', 'SEO Specialist'],
  'Education & Research': ['Researcher', 'Professor', 'Lecturer']
};

const EXPERIENCE_LEVELS = [
  { label: 'Intern', years: '' },
  { label: 'Entry', years: '0-2y' },
  { label: 'Mid', years: '3-5y' },
  { label: 'Senior', years: '6-10y' },
  { label: 'Staff+', years: '10y+' }
];

// --- AUTH MODAL ---

const AuthModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg">
                <span className="text-4xl font-black text-white leading-none font-sans">F</span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-900">Welcome to FitForWorks</h2>
              <p className="text-zinc-500">Sign in to access AI-powered resume tools</p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-zinc-200 rounded-2xl font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
              ) : (
                <>
                  {/* Google Icon */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-zinc-400">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- MAIN APP ---

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    // Initialize from URL hash or localStorage or default to landing
    const hash = window.location.hash.slice(1);
    // Check if hash contains OAuth tokens (access_token, error, etc.)
    if (hash.includes('access_token') || hash.includes('error')) {
      return 'landing'; // Will be updated after auth processing
    }
    const validViews = ['landing', 'dashboard', 'review', 'resumatcher', 'templates', 'coffee'];
    if (hash && validViews.includes(hash)) {
      return hash;
    }
    // Fallback to localStorage
    const saved = localStorage.getItem('currentView');
    if (saved && validViews.includes(saved)) {
      return saved;
    }
    return 'landing';
  });
  const [file, setFile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- PERSISTENT STATE ---
  // Review View State
  const [reviewStep, setReviewStep] = useState(1);
  const [reviewFile, setReviewFile] = useState(null);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewContext, setReviewContext] = useState({});

  // ResuMatcher View State
  const [matchStep, setMatchStep] = useState(1);
  const [matchFile, setMatchFile] = useState(null);
  const [matchJd, setMatchJd] = useState('');
  const [matchResult, setMatchResult] = useState(null);

  // Check auth state on mount and handle OAuth callback
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const hash = window.location.hash;
        console.log('🔐 Auth Init - Hash:', hash);

        // Check if this is an OAuth callback with tokens
        if (hash && hash.includes('access_token')) {
          console.log('🔐 OAuth callback detected - extracting tokens...');

          // Parse the hash to get the access token and refresh token
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('🔐 Setting session manually...');

            // Set the session using the tokens from the URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            console.log('🔐 setSession result:', data?.user?.email, error);

            if (data?.session?.user && mounted) {
              setUser(data.session.user);
              // Clean up URL and navigate to dashboard
              window.history.replaceState({ view: 'dashboard' }, '', '#dashboard');
              setCurrentView('dashboard');
              setAuthLoading(false);
              return;
            }
          }
        }

        // Normal session check (no OAuth callback)
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔐 getSession result:', session?.user?.email || 'no user');

        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            // Preserve the current hash view if it exists
            const hash = window.location.hash.slice(1);
            const validViews = ['landing', 'dashboard', 'review', 'resumatcher', 'templates', 'coffee'];
            if (hash && validViews.includes(hash)) {
              setCurrentView(hash);
            }
          }
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('🔐 Auth error:', error);
        if (mounted) setAuthLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        // Only redirect to dashboard if auth modal was open (user just signed in)
        // Don't redirect if this is just a session recovery on page load
        if (showAuthModal) {
          setShowAuthModal(false);
          window.history.replaceState({ view: 'dashboard' }, '', '#dashboard');
          setCurrentView('dashboard');
        }
        setAuthLoading(false);
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentView('landing');
        window.history.replaceState({ view: 'landing' }, '', '#landing');
      }

      if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Navigation function that updates browser history
  const navigateTo = (view) => {
    // Protected routes - require authentication
    const protectedRoutes = ['review', 'resumatcher', 'templates'];

    if (protectedRoutes.includes(view) && !user) {
      setShowAuthModal(true);
      return;
    }

    if (view !== currentView) {
      window.history.pushState({ view }, '', `#${view}`);
      setCurrentView(view);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigateTo('landing');
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.view) {
        setCurrentView(event.state.view);
      } else {
        const hash = window.location.hash.slice(1);
        setCurrentView(hash || 'landing');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Set initial history state
    if (!window.history.state) {
      window.history.replaceState({ view: currentView }, '', `#${currentView}`);
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    // Save current view to localStorage for persistence
    localStorage.setItem('currentView', currentView);
  }, [currentView]);

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center shadow-lg mx-auto">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div className="w-8 h-8 border-3 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-zinc-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans overflow-x-hidden">
      <GlobalStyles />

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigateTo('landing')}>
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/10 transition-transform group-hover:scale-95">
                <span className="text-xl font-black text-white leading-none font-sans">F</span>
              </div>
              <span className="font-bold text-lg md:text-xl tracking-tight text-zinc-900">FitForWorks</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <NavButton active={currentView === 'dashboard'} onClick={() => navigateTo('dashboard')}>Dashboard</NavButton>
              <NavButton active={currentView === 'review'} onClick={() => navigateTo('review')}>AI Review</NavButton>
              <NavButton active={currentView === 'resumatcher'} onClick={() => navigateTo('resumatcher')}>ResuMatcher</NavButton>
              <NavButton active={currentView === 'templates'} onClick={() => navigateTo('templates')}>Templates</NavButton>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Buy Me a Coffee Button */}
            <button
              onClick={() => navigateTo('coffee')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              <span>☕</span>
              <span>Support</span>
            </button>

            {/* Profile / Auth Button */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-indigo-100 shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white ring-2 ring-indigo-100 shadow-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 border-b border-zinc-100">
                    <p className="text-sm font-medium text-zinc-900 truncate">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="hidden md:flex w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white ring-2 ring-indigo-100 shadow-lg items-center justify-center hover:scale-105 transition-transform"
              >
                <User className="w-4 h-4 text-white" />
              </button>
            )}

            <button className="md:hidden p-2 text-zinc-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-b border-zinc-100 bg-white/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="p-4 space-y-2 flex flex-col">
                <NavButton active={currentView === 'dashboard'} onClick={() => navigateTo('dashboard')}>Dashboard</NavButton>
                <NavButton active={currentView === 'review'} onClick={() => navigateTo('review')}>AI Review</NavButton>
                <NavButton active={currentView === 'resumatcher'} onClick={() => navigateTo('resumatcher')}>ResuMatcher</NavButton>
                <NavButton active={currentView === 'templates'} onClick={() => navigateTo('templates')}>Templates</NavButton>
                <NavButton active={currentView === 'coffee'} onClick={() => navigateTo('coffee')}>☕ Support</NavButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Container */}
      <main className="pt-24 md:pt-28 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {currentView === 'landing' && <LandingPage key="landing" navigateTo={navigateTo} />}
          {currentView === 'dashboard' && <DashboardView key="dashboard" navigateTo={navigateTo} user={user} />}
          {currentView === 'review' && (
            <ReviewView
              key="review"
              step={reviewStep} setStep={setReviewStep}
              file={reviewFile} setFile={setReviewFile}
              analysisResult={reviewResult} setAnalysisResult={setReviewResult}
              userContext={reviewContext} setUserContext={setReviewContext}
            />
          )}
          {currentView === 'resumatcher' && (
            <ResuMatcherView
              key="resumatcher"
              step={matchStep} setStep={setMatchStep}
              file={matchFile} setFile={setMatchFile}
              jd={matchJd} setJd={setMatchJd}
              matchResult={matchResult} setMatchResult={setMatchResult}
            />
          )}
          {currentView === 'templates' && <TemplatesView key="templates" />}
          {currentView === 'coffee' && <CoffeeView key="coffee" />}
        </AnimatePresence>
      </main>
      <Analytics />
    </div>
  );
}

// --- SUB-VIEWS ---

const NavButton = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-3 md:py-2 rounded-lg text-sm font-medium transition-all duration-200 w-full md:w-auto text-left md:text-center",
      active ? "text-zinc-900 bg-zinc-100" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
    )}
  >
    {children}
  </button>
);

// --- COFFEE/SUPPORT VIEW ---

const CoffeeView = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="max-w-lg mx-auto py-12"
  >
    <div className="text-center space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="text-6xl">☕</div>
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight">
          Support FitForWorks
        </h1>
        <p className="text-zinc-500 text-lg">
          Buy me API credits!
        </p>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-lg">
          <img
            src="/qr-code.jpeg"
            alt="Buy Me a Coffee QR Code"
            className="w-48 h-48 rounded-lg object-cover"
          />
        </div>
        <p className="text-zinc-400 text-sm">Scan to support</p>
      </div>

      {/* Button */}
      <a
        href="https://buymeacoffee.com/jeycmd"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-2xl shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-105"
      >
        <span className="text-xl">☕</span>
        <span>Buy me a coffee</span>
        <ArrowRight className="w-5 h-5" />
      </a>

      {/* URL Display */}
      <div className="pt-4">
        <p className="text-zinc-400 text-sm">
          Or visit directly:
        </p>
        <a
          href="https://buymeacoffee.com/jeycmd"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
        >
          buymeacoffee.com/jeycmd
        </a>
      </div>
    </div>
  </motion.div>
);

// --- TEMPLATES VIEW ---

const TemplatesView = () => {
  const templates = [
    {
      id: 1,
      title: 'Classic Executive',
      file: '/templates/jakes-resume.pdf',
    },
    {
      id: 2,
      title: 'Modern Professional',
      file: '/templates/faangpath-simple-template.pdf',
    }
  ];

  // Debounce ref to prevent double clicks
  const isClickingRef = useRef(false);

  const handleDownload = (file, title) => {
    if (isClickingRef.current) return;
    isClickingRef.current = true;

    const link = document.createElement('a');
    link.href = file;
    link.download = `Resume_Template_${title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => { isClickingRef.current = false; }, 500);
  };

  const handleView = (file) => {
    if (isClickingRef.current) return;
    isClickingRef.current = true;

    window.open(file, '_blank');

    setTimeout(() => { isClickingRef.current = false; }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-4xl mx-auto py-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight mb-2">
          Resume Templates
        </h1>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Universally accepted by 99% of companies worldwide.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              {/* PDF Preview - Smaller */}
              <div className="relative bg-gradient-to-b from-zinc-50 to-zinc-100 p-3">
                <div className="rounded-lg border border-zinc-200 overflow-hidden shadow-inner bg-white">
                  <iframe
                    src={`${template.file}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                    className="w-full h-[280px] pointer-events-none"
                    title={template.title}
                  />
                </div>
              </div>

              {/* Footer with buttons */}
              <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-700">{template.title}</span>
                <div className="flex gap-2">
                  <a
                    href={template.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View
                  </a>
                  <a
                    href={template.file}
                    download={`Resume_Template_${template.title.replace(/\s+/g, '_')}.pdf`}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// --- LANDING PAGE ---

const COMPANY_LOGOS = [
  { name: 'Google', img: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png' },
  { name: 'Microsoft', img: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b?ver=5c31' },
  { name: 'Meta', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/200px-Meta_Platforms_Inc._logo.svg.png' },
  { name: 'Apple', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/100px-Apple_logo_black.svg.png' },
  { name: 'Amazon', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/200px-Amazon_logo.svg.png' },
  { name: 'Uber', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Uber_logo_2018.svg/150px-Uber_logo_2018.svg.png' },
  { name: 'Stripe', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/150px-Stripe_Logo%2C_revised_2016.svg.png' },
  { name: 'Netflix', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/200px-Netflix_2015_logo.svg.png' },
];

const BENCHMARKS = [
  {
    icon: Zap,
    title: 'AI Optimized',
    description: 'Advanced Models to analyzes your resume in bits',
    gradient: 'from-amber-400 to-orange-500',
    bgGlow: 'rgba(251, 191, 36, 0.15)'
  },
  {
    icon: Shield,
    title: 'ATS Pass Through',
    value: '95%',
    description: 'Optimized formatting to pass all tracking systems',
    gradient: 'from-emerald-400 to-teal-500',
    bgGlow: 'rgba(52, 211, 153, 0.15)'
  },
  {
    icon: Rocket,
    title: 'Interview Boost',
    description: 'Get 3x more interview callbacks with AI insights',
    gradient: 'from-violet-400 to-purple-500',
    bgGlow: 'rgba(167, 139, 250, 0.15)'
  }
];

const LandingPage = ({ navigateTo }) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    if (e.target.files?.[0]) {
      navigateTo('review');
    }
  };

  const heroWords = ['The', 'Only', 'Free', 'Resume', 'Helper', "You'll", 'Ever', 'Need'];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-16 md:space-y-24">
      {/* Hero Section */}
      <div className="text-center space-y-8 pt-8 md:pt-16">
        {/* Animated Hero Text */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-900 leading-tight tracking-tight">
            {heroWords.map((word, index) => (
              <span key={index} className="hero-text-animate inline-block mr-2 md:mr-3">
                <span className={`word-${index + 1} ${index >= 2 && index <= 4 ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent' : ''}`}>
                  {word}
                </span>
              </span>
            ))}
          </h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed font-light"
        >
          Build ATS-optimized resumes that pass screening systems and let AI craft compelling bullet points from your experience
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <Button
            onClick={() => navigateTo('dashboard')}
            size="lg"
            className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20 px-8 py-6 text-base"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>

      {/* Benchmark Blocks */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
      >
        {BENCHMARKS.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 + index * 0.15, duration: 0.5 }}
          >
            <Card className="h-full hover:ring-2 hover:ring-indigo-500/20 border-zinc-200 bg-white/90">
              <CardHeader className="text-center pb-2">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} shadow-lg mx-auto mb-4`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-lg">
                  {item.title}
                  {item.value && (
                    <span className={`ml-2 bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>
                      {item.value}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pt-0">
                <p className="text-sm text-zinc-500 leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6"
      >
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">
            Upload Your Resume to Start{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Free</span>
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Get your Resume Score instantly and discover how to maximize your resume's impact
          </p>
        </div>

        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx" />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="glow"
          size="lg"
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25"
        >
          <UploadCloud className="w-5 h-5 mr-2" />
          Upload Your Resume to Start Free
        </Button>
      </motion.div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

      {/* Company Logos Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">
            Best Resumes {' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Lands In</span>
          </h2>
          <p className="text-zinc-500">Your Dream Job :)</p>
        </div>

        {/* Infinite Scroll Logos */}
        <div className="logo-scroll-container py-3">
          <div className="logo-scroll-track">
            {COMPANY_LOGOS.map((company, index) => (
              <div key={`first-${index}`} className="flex items-center justify-center px-4 py-2 bg-zinc-50 rounded-lg border border-zinc-100 hover:bg-zinc-100 transition-colors min-w-[100px] h-10">
                <img src={company.img} alt={company.name} className="h-4 max-w-[60px] object-contain" />
              </div>
            ))}
            {COMPANY_LOGOS.map((company, index) => (
              <div key={`second-${index}`} className="flex items-center justify-center px-4 py-2 bg-zinc-50 rounded-lg border border-zinc-100 hover:bg-zinc-100 transition-colors min-w-[100px] h-10">
                <img src={company.img} alt={company.name} className="h-4 max-w-[60px] object-contain" />
              </div>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <p className="text-center text-xs text-zinc-400">
          ATS-optimized  <span className="mx-2">•</span> Let's crack the job
        </p>
      </motion.div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent my-8" />

      {/* Buy Me a Coffee Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row items-center justify-center gap-8 py-8"
      >
        {/* Coffee Cup Doodle + Text */}
        <div className="flex items-center gap-4">
          <div className="text-4xl">☕</div>
          <div className="text-left">
            <p className="text-zinc-600 text-sm font-medium">Enjoying FitForWorks?</p>
            <a
              href="https://buymeacoffee.com/jeycmd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 font-semibold text-base hover:underline underline-offset-2 transition-colors"
            >
              Buy me a coffee →
            </a>
          </div>
        </div>

        {/* Divider for mobile */}
        <div className="hidden md:block w-px h-16 bg-zinc-200" />

        {/* QR Code */}
        <div className="flex items-center gap-4">
          <img
            src="/qr-code.jpeg"
            alt="Buy Me a Coffee QR Code"
            className="w-16 h-16 rounded-lg border border-zinc-200 shadow-sm object-cover"
          />
          <p className="text-zinc-400 text-xs max-w-[120px]">Let's Buy Me A Coffee Now</p>
        </div>
      </motion.div>

      {/* Connect Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <p className="text-zinc-400 text-sm mb-3">Connect with me</p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://github.com/jayesh-cmd"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors group"
          >
            <Github className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900" />
          </a>
          <a
            href="https://www.linkedin.com/in/cmd-jayesh"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-zinc-100 hover:bg-blue-100 rounded-full transition-colors group"
          >
            <Linkedin className="w-5 h-5 text-zinc-600 group-hover:text-blue-600" />
          </a>
          <a
            href="https://youtube.com/@jey_script"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-zinc-100 hover:bg-red-100 rounded-full transition-colors group"
          >
            <Youtube className="w-5 h-5 text-zinc-600 group-hover:text-red-600" />
          </a>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-zinc-400 text-sm">
          Built for job seekers who want to stand out.{' '}
          <button onClick={() => navigateTo('dashboard')} className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
            Start your journey today →
          </button>
        </p>
      </div>
    </motion.div>
  );
};

const DashboardView = ({ navigateTo, user }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10 md:space-y-16">
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 leading-[1.1]">Hey, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'} 👋</h1>
      <p className="text-lg md:text-xl text-zinc-600 font-light">We need AI optimized Resume, cause in companies at first the resume is reviewed by AI.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <Card onClick={() => navigateTo('review')} className="group min-h-[280px] md:min-h-[320px] flex flex-col justify-between hover:ring-2 hover:ring-indigo-500/20 border-zinc-200 bg-white/90">
        <div className="absolute top-0 right-0 p-24 md:p-32 bg-indigo-100 blur-[60px] md:blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-200/80 transition-colors duration-500" />
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-500"><Bot className="w-5 h-5 md:w-6 md:h-6" /></div>
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 font-semibold">98% Accuracy</Badge>
          </div>
          <CardTitle className="text-2xl md:text-3xl text-zinc-900">AI Resume Review</CardTitle>
          <p className="text-sm md:text-base text-zinc-600 leading-relaxed font-normal mt-2 max-w-sm">Deep analysis of your resume structure, keywords, and impact metrics. Get a score and actionable fixes.</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">Analyze Resume <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /></div>
        </CardContent>
      </Card>

      <Card onClick={() => navigateTo('resumatcher')} className="group min-h-[280px] md:min-h-[320px] flex flex-col justify-between hover:ring-2 hover:ring-emerald-500/20 border-zinc-200 bg-white/90">
        <div className="absolute top-0 right-0 p-24 md:p-32 bg-emerald-100 blur-[60px] md:blur-[80px] rounded-full pointer-events-none group-hover:bg-emerald-200/80 transition-colors duration-500" />
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform duration-500"><GitMerge className="w-5 h-5 md:w-6 md:h-6" /></div>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 font-semibold">New Feature</Badge>
          </div>
          <CardTitle className="text-2xl md:text-3xl text-zinc-900">ResuMatcher</CardTitle>
          <p className="text-sm md:text-base text-zinc-600 leading-relaxed font-normal mt-2 max-w-sm">Paste a JD and your resume. We'll tell you exactly what's missing and how to tailor your bullet points.</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 transition-colors">Match Job Description <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /></div>
        </CardContent>
      </Card>

      <Card onClick={() => navigateTo('templates')} className="group min-h-[280px] md:min-h-[320px] flex flex-col justify-between hover:ring-2 hover:ring-amber-500/20 border-zinc-200 bg-white/90">
        <div className="absolute top-0 right-0 p-24 md:p-32 bg-amber-100 blur-[60px] md:blur-[80px] rounded-full pointer-events-none group-hover:bg-amber-200/80 transition-colors duration-500" />
        <CardHeader>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform duration-500"><FileText className="w-5 h-5 md:w-6 md:h-6" /></div>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-semibold">Free</Badge>
          </div>
          <CardTitle className="text-2xl md:text-3xl text-zinc-900">Resume Templates</CardTitle>
          <p className="text-sm md:text-base text-zinc-600 leading-relaxed font-normal mt-2 max-w-sm">Download ATS-friendly resume templates used by top candidates at FAANG companies.</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm font-semibold text-amber-600 group-hover:text-amber-700 transition-colors">View Templates <ArrowRight className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" /></div>
        </CardContent>
      </Card>
    </div>

    {/* Connect Section */}
    <div className="text-center pt-8">
      <p className="text-zinc-400 text-sm mb-3">Connect with me</p>
      <div className="flex items-center justify-center gap-4">
        <a
          href="https://github.com/jayesh-cmd"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors group"
        >
          <Github className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900" />
        </a>
        <a
          href="https://www.linkedin.com/in/cmd-jayesh"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-zinc-100 hover:bg-blue-100 rounded-full transition-colors group"
        >
          <Linkedin className="w-5 h-5 text-zinc-600 group-hover:text-blue-600" />
        </a>
        <a
          href="https://youtube.com/@jey_script"
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 bg-zinc-100 hover:bg-red-100 rounded-full transition-colors group"
        >
          <Youtube className="w-5 h-5 text-zinc-600 group-hover:text-red-600" />
        </a>
      </div>
    </div>
  </motion.div>
);

// --- REVIEW LOGIC ---

const ReviewView = ({ step, setStep, file, setFile, analysisResult, setAnalysisResult, userContext, setUserContext }) => {

  const handleUpload = (f) => { setFile(f); setStep(2); };
  const handleWizardComplete = (selections) => {
    setUserContext(selections);
    setStep(3);
  };

  useEffect(() => {
    if (step === 3 && file) {
      const analyze = async () => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          // Append user context for better LLM analysis
          if (userContext.category) formData.append('job_category', userContext.category);
          if (userContext.field) formData.append('job_role', userContext.field);
          if (userContext.level) formData.append('experience_level', userContext.level);

          const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Analysis failed');
          }

          const data = await response.json();
          setAnalysisResult(data);
          setStep(4);
        } catch (error) {
          console.error("Error analyzing resume:", error);
          alert("Failed to analyze resume. Please try again.");
          setStep(1);
        }
      };
      analyze();
    }
  }, [step, file, userContext]);

  return (
    <div className="max-w-6xl mx-auto py-4 md:py-8">
      {step === 1 && <UploadStep title="Upload your resume" subtitle="We'll scan for ATS readability, impact, and keyword optimization." onUpload={handleUpload} />}
      {step === 2 && <WizardModal onClose={() => setStep(1)} onComplete={handleWizardComplete} />}
      {step === 3 && <AnalysisScreen />}
      {step === 4 && <ReviewResults file={file} data={analysisResult} />}
    </div>
  );
};

const UploadStep = ({ title, subtitle, onUpload }) => {
  const fileInputRef = useRef(null);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
      <div className="text-center mb-10 md:mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-white shadow-sm text-xs text-zinc-600 mb-2 md:mb-4">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>AI Optimized Resume</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900">{title}</h2>
        <p className="text-base md:text-lg text-zinc-500 font-light max-w-lg mx-auto px-4">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="lg:col-span-2 border-dashed border-zinc-200 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 transition-all h-[300px] md:h-[400px] flex flex-col items-center justify-center relative group shadow-none cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} accept=".pdf,.doc,.docx" />
          <div className="text-center space-y-4 md:space-y-6 px-4 pointer-events-none">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform duration-300 shadow-md shadow-zinc-100">
              <UploadCloud className="w-8 h-8 md:w-10 md:h-10 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-zinc-900">Drop PDF or DOCX here</h3>
              <p className="text-zinc-500 mt-2 font-light">or click to browse files</p>
            </div>
          </div>
        </Card>
        <div className="space-y-4">
          <div className="p-4 md:p-6 rounded-2xl border border-zinc-200 bg-white/50 backdrop-blur-sm">
            <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4 md:mb-6">Review includes</h4>
            <div className="space-y-3 md:space-y-4">
              {[{ label: 'Parser Check', icon: Code2 }, { label: 'Impact Scoring', icon: Target }, { label: 'Formatting', icon: Palette }, { label: 'Keywords', icon: Fingerprint }].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-zinc-600"><div className="p-2 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-400"><item.icon className="w-4 h-4" /></div><span className="text-sm font-medium">{item.label}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const ReviewResults = ({ file, data }) => {
  // Transform backend data to UI format
  const result = data ? {
    score: data.ats_score || 0,
    potentialScore: Math.min(100, (data.ats_score || 0) + 15),
    summary: data.summary || "Analysis complete.",
    improvements: data.improvements || [],
    detailedImprovements: data.detailed_improvements || [],
    strengths: data.strengths || [],
    githubFeedback: data.github_feedback || "No GitHub data available.",
    // Domain mismatch handling
    domainMismatch: data.domain_mismatch || false,
    domainMismatchAdvice: data.domain_mismatch_advice || null,
    // Score breakdown from backend (with fallback defaults)
    scoreBreakdown: {
      contentQuality: data.content_quality || 8,
      atsStructure: data.ats_structure || 8,
      jobOptimization: data.job_optimization || 7,
      writingQuality: data.writing_quality || 8,
      applicationReady: data.application_ready || 7
    }
  } : MOCK_ANALYSIS_RESULT;

  // Animated count-up hook
  const [displayScore, setDisplayScore] = useState(0);
  const [showRewrittenContent, setShowRewrittenContent] = useState(false);

  useEffect(() => {
    let start = 0;
    const end = result.score;
    const duration = 1500;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [result.score]);

  const getScoreStatus = (score) => {
    if (score >= 80) return { label: 'Excellent Resume!', class: 'badge-excellent', color: 'text-emerald-500' };
    if (score >= 60) return { label: 'Good Progress', class: 'badge-good', color: 'text-amber-500' };
    return { label: 'Needs Improvement', class: 'badge-needs-work', color: 'text-red-500' };
  };

  const status = getScoreStatus(result.score);
  const circleDasharray = 440;
  const circleOffset = circleDasharray - (circleDasharray * result.score) / 100;
  const gap = 100 - result.score;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight">Analysis Report</h2>
          <p className="text-zinc-500 mt-1">{file?.name} • Evaluated just now</p>
        </div>
        <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25">
          <Sparkles className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </motion.div>

      {/* Main Grid: Left (ATS + Score Breakdown) | Right (Industry Benchmark) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN - ATS Score + Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-5"
        >
          {/* Medium ATS Score Card */}
          <Card className="border border-white/50 bg-white/60 backdrop-blur-md shadow-md shadow-indigo-100/10">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Medium Circular Gauge */}
                <div className="relative w-40 h-40 md:w-48 md:h-48 mb-4">
                  <svg className="w-full h-full transform -rotate-90 overflow-visible">
                    <circle cx="50%" cy="50%" r="42%" stroke="#f4f4f5" strokeWidth="10" fill="transparent" />
                    <motion.circle
                      cx="50%" cy="50%" r="42%"
                      stroke="url(#atsScoreGradient)"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={circleDasharray}
                      strokeDashoffset={circleDasharray}
                      animate={{ strokeDashoffset: circleOffset }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="atsScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={result.score >= 75 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444'} />
                        <stop offset="100%" stopColor={result.score >= 75 ? '#34d399' : result.score >= 50 ? '#fbbf24' : '#f87171'} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl md:text-5xl font-bold text-zinc-900">{displayScore}</span>
                    <span className="text-sm text-zinc-400 uppercase tracking-wider mt-1">ATS Score</span>
                  </div>
                </div>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${status.class} mb-2`}>
                  {status.label}
                </span>
                <p className="text-sm text-zinc-500">{result.score}% of maximum possible score</p>
              </div>
            </CardContent>
          </Card>

          {/* Minimal Score Breakdown */}
          <Card className="border border-zinc-200">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-bold text-zinc-900">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="space-y-2">
                {[
                  { label: 'Content', score: result.scoreBreakdown.contentQuality },
                  { label: 'ATS', score: result.scoreBreakdown.atsStructure },
                  { label: 'Job Fit', score: result.scoreBreakdown.jobOptimization },
                  { label: 'Writing', score: result.scoreBreakdown.writingQuality },
                  { label: 'Ready', score: result.scoreBreakdown.applicationReady },
                ].map((item, i) => {
                  const getColor = (s) => s >= 7 ? 'bg-emerald-500' : s >= 5 ? 'bg-amber-500' : 'bg-red-500';
                  const getTextColor = (s) => s >= 7 ? 'text-emerald-600' : s >= 5 ? 'text-amber-600' : 'text-red-600';
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600 w-14 truncate">{item.label}</span>
                      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score * 10}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                          className={`h-full rounded-full ${getColor(item.score)}`}
                        />
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${getTextColor(item.score)}`}>{item.score}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* RIGHT COLUMN - Industry Benchmark */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3 space-y-6"
        >
          <Card className="border border-zinc-200">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-sm font-bold text-zinc-900">Industry Benchmark</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {/* Gradient Zone Chart */}
              {/* Gradient Zone Chart */}
              <div className="relative mb-3 mt-4 py-8">
                <div className="h-8 rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 relative shadow-sm">
                  <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-bold text-white drop-shadow-md">
                    <span>Low</span>
                    <span>Average</span>
                    <span>Top</span>
                  </div>
                </div>
                <motion.div
                  className="absolute top-8 -translate-x-1/2"
                  initial={{ left: '0%' }}
                  animate={{ left: `${Math.min(98, Math.max(2, result.score))}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                >
                  <div className="w-1 h-8 bg-zinc-900 rounded-full shadow-md" />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className="px-3 py-1 bg-zinc-900 text-white text-xs font-bold rounded-lg shadow-xl">
                      You: {result.score}%
                    </div>
                  </div>
                </motion.div>
              </div>
              <div className="flex justify-between text-[9px] text-zinc-400">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </CardContent>
          </Card>

          {/* New Summary Card */}
          <Card className="border border-zinc-200">
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-sm font-bold text-zinc-900">Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                <p className="text-base text-zinc-600 leading-relaxed">{result.summary}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* GitHub Portfolio & Improvements Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GitHub Portfolio Card - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border border-zinc-200 bg-white h-full">
            <CardHeader className="py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <GitMerge className="w-4 h-4 text-zinc-700" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">GitHub Portfolio</h4>
                  <p className="text-zinc-500 text-xs">Code & project quality</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <p className="text-zinc-700 text-sm leading-relaxed">{result.githubFeedback}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Strengths Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="h-full bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border-emerald-100/50">
            <CardHeader className="py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-zinc-900">Resume Strengths</h4>
                  <p className="text-zinc-500 text-xs">{result.strengths.length} strengths</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              <div className="space-y-2">
                {result.strengths.map((item, i) => (
                  <div key={i} className="flex gap-2 p-2 bg-white/60 rounded-lg border border-emerald-100/50 text-sm text-zinc-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Improvements Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-red-50/50 to-orange-50/50 border-red-100/50">
          <CardHeader className="py-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900">
                  {result.domainMismatch ? 'Career Transition Tips' : 'Improvements Needed'}
                </h4>
                <p className="text-zinc-500 text-xs">{result.improvements.length} areas to focus on</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            {/* Domain Mismatch Advisory */}
            {result.domainMismatch && result.domainMismatchAdvice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200"
              >
                <div className="flex gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-amber-800 text-sm mb-1">Career Transition Detected</h5>
                    <p className="text-sm text-amber-700 leading-relaxed">{result.domainMismatchAdvice}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-2 mb-4">
              {result.improvements.map((item, i) => (
                <div key={i} className="flex gap-2 p-2 bg-white/60 rounded-lg border border-red-100/50 text-sm text-zinc-700">
                  <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs font-bold text-red-600">{i + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Modify My Resume Button */}
            <button
              onClick={() => setShowRewrittenContent(!showRewrittenContent)}
              className={cn(
                "w-full py-2.5 px-4 font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm",
                result.domainMismatch
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25"
                  : "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-red-500/25"
              )}
            >
              <Sparkles className="w-4 h-4" />
              {showRewrittenContent ? 'Hide Suggestions' : (result.domainMismatch ? 'View Transition Guide' : 'Get Improvement Tips')}
            </button>

            {/* Rewritten Content - Shows EXACT point to modify */}
            <AnimatePresence>
              {showRewrittenContent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4"
                >
                  {/* Header */}
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <h5 className="font-bold text-zinc-900 text-base flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      {result.domainMismatch ? 'Your Personalized Action Plan' : 'Exact Changes to Make'}
                    </h5>
                    <p className="text-sm text-zinc-600">
                      {result.detailedImprovements?.length > 0
                        ? `We found ${result.detailedImprovements.length} specific improvements. Each shows exactly what to change.`
                        : 'Review the general tips below to improve your resume.'}
                    </p>
                  </div>

                  {/* Detailed Improvements - If available from LLM */}
                  {result.detailedImprovements?.length > 0 ? (
                    <div className="space-y-4">
                      {result.detailedImprovements.map((improvement, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Location Header */}
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                              {i + 1}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-medium">
                                {improvement.section || 'Section'}
                              </span>
                              <ChevronRight className="w-3 h-3 text-zinc-400" />
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md font-medium">
                                {improvement.item || 'Item'}
                              </span>
                              {improvement.location && (
                                <>
                                  <ChevronRight className="w-3 h-3 text-zinc-400" />
                                  <span className="text-zinc-500 text-xs">{improvement.location}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Original vs Suggested */}
                          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 relative">
                            {/* Original Text */}
                            <div className="flex flex-col h-full">
                              {improvement.original_text && (
                                <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 flex-1">
                                  <p className="text-[10px] uppercase font-bold text-red-500 mb-2 flex items-center gap-1.5 opacity-80">
                                    <X className="w-3 h-3" /> Original
                                  </p>
                                  <p className="text-sm text-zinc-600 leading-relaxed font-mono text-[13px] bg-white/50 p-2 rounded border border-red-100/50">
                                    "{improvement.original_text}"
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Arrow Divider */}
                            <div className="hidden md:flex flex-col justify-center items-center py-4">
                              <div className="p-1.5 bg-zinc-50 border border-zinc-200 rounded-full z-10">
                                <ArrowRight className="w-4 h-4 text-zinc-400" />
                              </div>
                            </div>
                            <div className="flex md:hidden justify-center -my-2 z-10">
                              <div className="p-1.5 bg-white border border-zinc-200 rounded-full shadow-sm">
                                <ArrowRight className="w-4 h-4 text-zinc-400 rotate-90" />
                              </div>
                            </div>

                            {/* Suggested Text */}
                            <div className="flex flex-col h-full">
                              {improvement.suggested_text && (
                                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex-1 shadow-sm">
                                  <p className="text-[10px] uppercase font-bold text-emerald-600 mb-2 flex items-center gap-1.5 opacity-80">
                                    <Check className="w-3 h-3" /> Improved
                                  </p>
                                  <p className="text-sm text-zinc-800 leading-relaxed font-semibold">
                                    "{improvement.suggested_text}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Reasoning Footer */}
                          {improvement.reason && (
                            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-start gap-3">
                              <div className="p-1.5 bg-indigo-50 rounded-lg shrink-0 mt-0.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                              </div>
                              <div>
                                <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide mb-0.5">Why this matters</p>
                                <p className="text-sm text-zinc-600 leading-relaxed">
                                  {improvement.reason}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback to general tips if no detailed improvements */
                    <div className="space-y-3">
                      {result.improvements.map((item, i) => (
                        <div key={i} className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0 text-xs font-bold text-white">{i + 1}</span>
                            <p className="text-sm text-zinc-800">{item}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="text-xs text-zinc-500 italic flex items-center gap-2">
                      {result.domainMismatch ? (
                        <>🚀 Career changes are achievable! Focus on these steps to build your path forward.</>
                      ) : (
                        <>💡 Apply these exact changes to boost your ATS score significantly!</>
                      )}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// --- RESUMATCHER LOGIC ---

const ResuMatcherView = ({ step, setStep, file, setFile, jd, setJd, matchResult, setMatchResult }) => {

  const handleUpload = (f) => { setFile(f); setTimeout(() => setStep(2), 500); };

  const handleJDSubmit = async () => {
    setStep(3);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jd', jd);

      const response = await fetch('http://localhost:8000/match', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Match failed");

      const data = await response.json();
      setMatchResult(data);
      setStep(4);
    } catch (e) {
      console.error(e);
      alert("Match analysis failed");
      setStep(1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      {step === 1 && (
        <UploadStep
          title="First, upload your resume"
          subtitle="We need your resume to compare against the job requirements."
          onUpload={handleUpload}
        />
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-zinc-900">Paste the Job Description</h2>
            <p className="text-zinc-500 mt-2">Paste the full job description below to identify gaps.</p>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 bg-white/50 mb-6">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><CheckCircle2 size={16} /></div>
            <span className="text-sm font-medium text-zinc-700 line-clamp-1">{file?.name}</span>
            <button onClick={() => setStep(1)} className="ml-auto text-xs text-zinc-400 hover:text-zinc-900">Change</button>
          </div>
          <div className="relative">
            <textarea
              className="w-full h-64 rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 resize-none shadow-sm transition-all"
              placeholder="Paste the complete job description here... (minimum 100 words required)"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
            ></textarea>
            {/* Word Counter */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${jd.trim().split(/\s+/).filter(w => w).length >= 100
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-zinc-100 text-zinc-500'
                }`}>
                {jd.trim().split(/\s+/).filter(w => w).length} / 100 words
              </span>
            </div>
          </div>
          {/* Validation Message */}
          {jd.trim() && jd.trim().split(/\s+/).filter(w => w).length < 100 && (
            <p className="text-sm text-amber-600 mt-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Please enter at least 100 words for accurate analysis
            </p>
          )}
          <Button
            className="w-full h-12 text-base mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 disabled:from-zinc-300 disabled:to-zinc-400 disabled:shadow-none"
            onClick={handleJDSubmit}
            disabled={jd.trim().split(/\s+/).filter(w => w).length < 100}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Run Match Analysis
          </Button>
        </motion.div>
      )}

      {step === 3 && <AnalysisScreen />}
      {step === 4 && <MatchResults file={file} data={matchResult} />}
    </div>
  );
};

const MatchResults = ({ file, data }) => {
  const result = data ? {
    matchScore: data.match_score || 0,
    potentialScore: data.potential_score || 0,
    missingKeywords: data.missing_keywords || [],
    matchingKeywords: data.matching_keywords || [],
    recommendation: data.recommendation || "No recommendation.",
    detailedImprovements: data.detailed_improvements || [],
    improvements: data.improvements || [],
  } : MOCK_JD_MATCH_RESULT;

  // Animated count-up hook
  const [displayScore, setDisplayScore] = useState(0);
  const [showRewrittenContent, setShowRewrittenContent] = useState(false);
  useEffect(() => {
    let start = 0;
    const end = result.matchScore;
    const duration = 1500;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [result.matchScore]);

  const getMatchStatus = (score) => {
    if (score >= 75) return { label: 'High Match!', class: 'badge-excellent', color: 'from-emerald-500 to-teal-500' };
    if (score >= 50) return { label: 'Moderate Match', class: 'badge-good', color: 'from-amber-500 to-orange-500' };
    return { label: 'Low Match', class: 'badge-needs-work', color: 'from-red-500 to-rose-500' };
  };

  const status = getMatchStatus(result.matchScore);
  const circleDasharray = 440;
  const circleOffset = circleDasharray - (circleDasharray * result.matchScore) / 100;
  const gap = 100 - result.matchScore;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight">Match Report</h2>
          <p className="text-zinc-500 mt-1">Resume vs. Job Description</p>
        </div>
        <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
          <Sparkles className="w-4 h-4 mr-2" />
          New Match
        </Button>
      </motion.div>

      {/* Hero Score Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="gradient-border p-8 md:p-10"
      >
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Circular Score Gauge */}
          <div className="relative flex-shrink-0">
            <div className="relative w-48 h-48 md:w-56 md:h-56">
              <svg className="w-full h-full transform -rotate-90 overflow-visible">
                <circle
                  cx="50%" cy="50%" r="45%"
                  stroke="#f4f4f5"
                  strokeWidth="12"
                  fill="transparent"
                />
                <motion.circle
                  cx="50%" cy="50%" r="45%"
                  stroke="url(#matchGradientDynamic)"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={circleDasharray}
                  strokeDashoffset={circleDasharray}
                  animate={{ strokeDashoffset: circleOffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="matchGradientDynamic" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={result.matchScore >= 75 ? '#10b981' : result.matchScore >= 50 ? '#f59e0b' : '#ef4444'} />
                    <stop offset="100%" stopColor={result.matchScore >= 75 ? '#34d399' : result.matchScore >= 50 ? '#fbbf24' : '#f87171'} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl md:text-6xl font-bold text-zinc-900 count-up">
                  {displayScore}%
                </span>
                <span className="text-sm text-zinc-400 uppercase tracking-wider mt-1">Match Score</span>
              </div>
            </div>
          </div>

          {/* Score Details */}
          <div className="flex-1 space-y-6 w-full">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${status.class}`}>
                {status.label}
              </span>
              <span className="text-sm text-zinc-500">
                {result.matchingKeywords.length} of {result.matchingKeywords.length + result.missingKeywords.length} keywords matched
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-zinc-700">Match Breakdown</span>
                <span className={`font-bold ${result.matchScore >= 75 ? 'text-emerald-600' :
                  result.matchScore >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                  {result.matchScore}% aligned with JD
                </span>
              </div>
              <div className="h-4 bg-zinc-100 rounded-full overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.matchScore}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className={`h-full rounded-full progress-bar ${result.matchScore >= 75 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                    result.matchScore >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      'bg-gradient-to-r from-red-500 to-rose-500'
                    }`}
                />
                <div
                  className="absolute top-0 right-0 h-full bg-zinc-200 rounded-r-full flex items-center justify-center"
                  style={{ width: `${gap}%` }}
                >
                  {gap > 10 && (
                    <span className="text-[10px] font-medium text-zinc-500 px-2">+{gap}% potential</span>
                  )}
                </div>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className={`p-4 rounded-xl border backdrop-blur-sm ${result.matchScore >= 75
              ? 'bg-emerald-50/40 border-emerald-100/50'
              : result.matchScore >= 50
                ? 'bg-amber-50/40 border-amber-100/50'
                : 'bg-red-50/40 border-red-100/50'
              }`}>
              <div className="flex gap-3">
                <Sparkles className={`w-5 h-5 shrink-0 mt-0.5 ${result.matchScore >= 75
                  ? 'text-emerald-500'
                  : result.matchScore >= 50
                    ? 'text-amber-500'
                    : 'text-red-500'
                  }`} />
                <p className="text-sm text-zinc-700 leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Keywords Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Keywords */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full bg-gradient-to-br from-red-50/50 to-orange-50/50 border-red-100/50 hover:shadow-lg hover:shadow-red-100/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">Missing Keywords</h4>
                  <p className="text-zinc-500 text-sm">{result.missingKeywords.length} skills not found in your resume</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {result.missingKeywords.map((kw, i) => (
                  <motion.span
                    key={kw}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/80 text-red-700 rounded-lg text-sm border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all cursor-default shadow-sm"
                  >
                    <X className="w-3 h-3" />
                    {kw}
                  </motion.span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Matching Keywords */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border-emerald-100/50 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">Matched Keywords</h4>
                  <p className="text-zinc-500 text-sm">{result.matchingKeywords.length} skills already in your resume</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {result.matchingKeywords.map((kw, i) => (
                  <motion.span
                    key={kw}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/80 text-emerald-700 rounded-lg text-sm border border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-default shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    {kw}
                  </motion.span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Improvements Section - Same as AI Review */}
      {(result.detailedImprovements?.length > 0 || result.improvements?.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 border-amber-100/50">
            <CardHeader className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900">Resume Improvements</h4>
                  <p className="text-zinc-500 text-sm">Specific changes to improve your match score</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              {/* Modify Button */}
              <button
                onClick={() => setShowRewrittenContent(!showRewrittenContent)}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-300 flex items-center justify-center gap-2 mb-4"
              >
                <Sparkles className="w-4 h-4" />
                {showRewrittenContent ? 'Hide Details' : 'Make Compatible'}
              </button>

              {/* Detailed Improvements Content */}
              <AnimatePresence>
                {showRewrittenContent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                      <h5 className="font-bold text-zinc-900 text-base flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        Exact Changes to Make
                      </h5>
                      <p className="text-sm text-zinc-600">
                        {result.detailedImprovements?.length > 0
                          ? `We found ${result.detailedImprovements.length} specific improvements to boost your match score.`
                          : 'Review these tips to improve your resume match.'}
                      </p>
                    </div>

                    {/* Detailed Improvements */}
                    {result.detailedImprovements?.length > 0 ? (
                      <div className="space-y-4">
                        {result.detailedImprovements.map((improvement, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-4 bg-white rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
                          >
                            {/* Location Header */}
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                                {i + 1}
                              </span>
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md font-medium">
                                  {improvement.section || 'Section'}
                                </span>
                                <ChevronRight className="w-3 h-3 text-zinc-400" />
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md font-medium">
                                  {improvement.item || 'Item'}
                                </span>
                                {improvement.location && (
                                  <>
                                    <ChevronRight className="w-3 h-3 text-zinc-400" />
                                    <span className="text-zinc-500 text-xs">{improvement.location}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Original vs Suggested */}
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 relative">
                              {/* Original Text */}
                              <div className="flex flex-col h-full">
                                {improvement.original_text && (
                                  <div className="p-4 bg-red-50/50 rounded-xl border border-red-100 flex-1">
                                    <p className="text-[10px] uppercase font-bold text-red-500 mb-2 flex items-center gap-1.5 opacity-80">
                                      <X className="w-3 h-3" /> Original
                                    </p>
                                    <p className="text-sm text-zinc-600 leading-relaxed font-mono text-[13px] bg-white/50 p-2 rounded border border-red-100/50">
                                      "{improvement.original_text}"
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Arrow Divider */}
                              <div className="hidden md:flex flex-col justify-center items-center py-4">
                                <div className="p-1.5 bg-zinc-50 border border-zinc-200 rounded-full z-10">
                                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                                </div>
                              </div>
                              <div className="flex md:hidden justify-center -my-2 z-10">
                                <div className="p-1.5 bg-white border border-zinc-200 rounded-full shadow-sm">
                                  <ArrowRight className="w-4 h-4 text-zinc-400 rotate-90" />
                                </div>
                              </div>

                              {/* Suggested Text */}
                              <div className="flex flex-col h-full">
                                {improvement.suggested_text && (
                                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 flex-1 shadow-sm">
                                    <p className="text-[10px] uppercase font-bold text-emerald-600 mb-2 flex items-center gap-1.5 opacity-80">
                                      <Check className="w-3 h-3" /> Improved
                                    </p>
                                    <p className="text-sm text-zinc-800 leading-relaxed font-semibold">
                                      "{improvement.suggested_text}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Reasoning Footer */}
                            {improvement.reason && (
                              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-start gap-3">
                                <div className="p-1.5 bg-indigo-50 rounded-lg shrink-0 mt-0.5">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide mb-0.5">Why this matters</p>
                                  <p className="text-sm text-zinc-600 leading-relaxed">
                                    {improvement.reason}
                                  </p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      /* Fallback to general tips */
                      <div className="space-y-3">
                        {result.improvements?.map((item, i) => (
                          <div key={i} className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                            <div className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-xs font-bold text-white">{i + 1}</span>
                              <p className="text-sm text-zinc-800">{item}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                      <p className="text-xs text-zinc-500 italic flex items-center gap-2">
                        💡 Apply these exact changes to significantly improve your job match score!
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

// --- SHARED COMPONENTS ---

const WizardModal = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [selections, setSelections] = useState({ category: '', field: '', level: '' });

  const handleSelect = (key, value) => {
    const newSelections = { ...selections, [key]: value };
    setSelections(newSelections);
    setTimeout(() => {
      if (step < totalSteps) setStep(step + 1);
      else onComplete(newSelections);
    }, 250);
  };

  const getRoles = () => ROLES[selections.category] || ROLES['Software Engineering'];

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-500/20 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl glass-panel rounded-2xl shadow-2xl overflow-hidden border border-white max-h-[90vh] flex flex-col" style={{ backgroundColor: 'rgba(255,255,255,0.98)' }}>
        <div className="p-6 md:p-12 pb-0">
          <div className="flex justify-between items-start mb-6 md:mb-10">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              {step > 1 && (
                <motion.button
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={handleBack}
                  className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
              <div>
                <p className="text-xs font-mono text-indigo-500 mb-2 font-medium">STEP 0{step}</p>
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">{step === 1 ? 'Select Domain' : step === 2 ? `Specific Role` : 'Experience Level'}</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors p-2"><X className="w-6 h-6" /></button>
          </div>
        </div>
        <div className="p-6 md:p-12 pt-0 overflow-y-auto min-h-[300px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <WizardStep key="step1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">{CATEGORIES.map(cat => (<SelectionButton key={cat.id} label={cat.label} icon={cat.icon} active={selections.category === cat.id} onClick={() => handleSelect('category', cat.id)} />))}</div>
              </WizardStep>
            )}
            {step === 2 && (
              <WizardStep key="step2">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{getRoles().map(label => (<button key={label} onClick={() => handleSelect('field', label)} className={cn("px-2 py-3 md:py-4 rounded-xl border text-xs md:text-sm font-medium transition-all duration-200 min-h-[70px] md:min-h-[80px] flex items-center justify-center text-center", selections.field === label ? "bg-zinc-900 text-white border-zinc-900 shadow-md" : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 hover:shadow-sm")}>{label}</button>))}</div>
              </WizardStep>
            )}
            {step === 3 && (
              <WizardStep key="step3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">{EXPERIENCE_LEVELS.map(item => (<div key={item.label} onClick={() => handleSelect('level', item.label)} className={cn("cursor-pointer rounded-xl border p-4 md:p-6 text-center transition-all duration-200 hover:scale-[1.02] flex flex-col items-center justify-center gap-1", selections.level === item.label ? "bg-indigo-50 border-indigo-200" : "bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300")}><span className={cn("text-sm md:text-base font-bold", selections.level === item.label ? "text-indigo-900" : "text-zinc-900")}>{item.label}</span>{item.years && (<span className={cn("text-xs font-medium", selections.level === item.label ? "text-indigo-600" : "text-zinc-400")}>{item.years}</span>)}</div>))}</div>
              </WizardStep>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const WizardStep = ({ children }) => (<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">{children}</motion.div>);

const SelectionButton = ({ label, icon: Icon, active, onClick }) => (
  <button onClick={onClick} className={cn("h-24 md:h-32 rounded-xl border flex flex-col items-center justify-center gap-2 md:gap-3 transition-all duration-200", active ? "bg-zinc-900 text-white border-zinc-900 shadow-lg scale-[1.02]" : "bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 hover:shadow-sm")}>{Icon && <Icon className={cn("w-5 h-5 md:w-6 md:h-6", active ? "text-white" : "text-zinc-400")} />}<span className="text-xs md:text-sm font-medium">{label}</span></button>
);

const AnalysisScreen = () => {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);

  const stages = [
    { label: 'Parsing Resume...', icon: '📄', progress: 20 },
    { label: 'Extracting GitHub Links...', icon: '🔗', progress: 40 },
    { label: 'Analyzing Content...', icon: '🔍', progress: 60 },
    { label: 'Scoring ATS Compatibility...', icon: '📊', progress: 80 },
    { label: 'Generating Insights...', icon: '✨', progress: 95 },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 95) return 95;
        // Update stage based on progress
        const newStage = stages.findIndex(s => p < s.progress);
        if (newStage !== -1 && newStage !== currentStage) {
          setCurrentStage(newStage);
        }
        return p + 0.8;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [currentStage]);

  const stage = stages[currentStage] || stages[stages.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] py-12"
    >
      {/* Animated Logo */}
      <motion.div
        className="relative mb-10"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
          <motion.span
            className="text-4xl"
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            {stage.icon}
          </motion.span>
        </div>
        {/* Orbiting dots */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute -top-2 left-1/2 w-3 h-3 bg-indigo-400 rounded-full shadow-lg" />
        </motion.div>
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute -bottom-2 left-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-lg" />
        </motion.div>
      </motion.div>

      {/* Stage Label */}
      <motion.div
        key={stage.label}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h3 className="text-xl md:text-2xl font-bold text-zinc-900 mb-2">{stage.label}</h3>
        <p className="text-sm text-zinc-400">This may take a few moments...</p>
      </motion.div>

      {/* Progress Bar */}
      <div className="w-72 md:w-96 space-y-3">
        <div className="relative h-3 bg-zinc-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 shimmer" />
          </motion.div>
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          <span>{Math.round(progress)}%</span>
          <span>Analyzing...</span>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="flex items-center gap-2 mt-8">
        {stages.map((s, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i <= currentStage ? "bg-indigo-500" : "bg-zinc-200"
            )}
            animate={i === currentStage ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        ))}
      </div>
    </motion.div>
  );
};