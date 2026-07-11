import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../App';
import { trackCtaClick } from '../../lib/ga4';

interface PublicNavProps {
  /** Extra nav links to show on desktop (e.g. scroll-to-section buttons on Landing) */
  children?: React.ReactNode;
}

export default function PublicNav({ children }: PublicNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.hash, location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleCta = useCallback(() => {
    trackCtaClick('nav');
    if (user) navigate('/app');
    else navigate('/login?mode=signup');
  }, [user, navigate]);

  const closeMobile = useCallback(() => setMobileMenuOpen(false), []);

  const linkClass = 'text-sm font-medium text-slate-400 hover:text-white transition-colors hidden md:block';
  const mobileLinkClass = 'block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/favicon.png" alt="CipherExam" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-mono text-lg font-semibold text-brand-400" aria-hidden="true">⟨</span>
          <span className="text-lg font-bold tracking-tight text-white font-display">CipherExam</span>
          <span className="font-mono text-lg font-semibold text-brand-400" aria-hidden="true">⟩</span>
        </Link>

        <div className="flex items-center gap-6">
          {/* Desktop extra links (passed as children) */}
          {children}

          {/* Standard desktop links */}
          <a href="/#features" className={linkClass}>Features</a>
          <a href="/#exams" className={linkClass}>Exams</a>
          <a href="/#how-it-works" className={linkClass}>How It Works</a>
          <Link to="/story" className={linkClass}>Our Story</Link>
          <Link to="/pricing" className={linkClass}>Pricing</Link>
          <Link to="/blog" className={linkClass}>Blog</Link>
          {/* Exam Lens on large desktop only — adding to the standard linkClass causes
              wrapping at md sizes. Mobile menu always shows it. */}
          <Link to="/exam-lens" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden lg:block">Exam Lens</Link>
          <Link
            to="/#testimonial"
            className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-300 hover:bg-brand-500/20 hover:border-brand-400/50 hover:text-brand-200 transition-all"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7.17 6A5.17 5.17 0 002 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 017.17 9.5V6zm10 0a5.17 5.17 0 00-5.17 5.17V18h6.83v-6.83H15.5A1.67 1.67 0 0117.17 9.5V6z" />
            </svg>
            Testimonials
          </Link>

          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden md:block"
          >
            Sign In
          </button>
          <button
            onClick={handleCta}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors hidden md:block ${
              scrolled
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500'
                : 'bg-white text-slate-950 hover:bg-slate-200'
            }`}
          >
            Start Free Trial
          </button>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
            aria-label="Toggle menu"
          >
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out bg-slate-950/95 backdrop-blur-lg border-t border-white/5 ${
          mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 py-6 space-y-1">
          <a href="/#features" onClick={closeMobile} className={mobileLinkClass}>Features</a>
          <a href="/#exams" onClick={closeMobile} className={mobileLinkClass}>Exams</a>
          <a href="/#how-it-works" onClick={closeMobile} className={mobileLinkClass}>How It Works</a>
          <Link to="/story" onClick={closeMobile} className={mobileLinkClass}>Our Story</Link>
          <Link to="/pricing" onClick={closeMobile} className={mobileLinkClass}>Pricing</Link>
          <Link to="/blog" onClick={closeMobile} className={mobileLinkClass}>Blog</Link>
          <Link to="/exam-lens" onClick={closeMobile} className={mobileLinkClass}>Exam Lens</Link>
          <Link
            to="/#testimonial"
            onClick={closeMobile}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-base font-bold border border-brand-500/30 bg-brand-500/10 text-brand-300 hover:bg-brand-500/20 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7.17 6A5.17 5.17 0 002 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 017.17 9.5V6zm10 0a5.17 5.17 0 00-5.17 5.17V18h6.83v-6.83H15.5A1.67 1.67 0 0117.17 9.5V6z" />
            </svg>
            Testimonials
          </Link>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <button onClick={() => { closeMobile(); navigate('/login'); }} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-base font-bold text-white hover:bg-slate-800 transition-colors">Sign In</button>
            <button onClick={() => { closeMobile(); handleCta(); }} className="w-full rounded-xl bg-brand-600 px-4 py-3 text-base font-bold text-white hover:bg-brand-500 transition-colors">Start Free Trial</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
