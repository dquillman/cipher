import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../../config/support';

const columnHeaderClass = 'text-sm font-bold text-slate-300 uppercase tracking-wider mb-4';
// inline-flex + min-h-[44px] gives each link a real touch target; the 25px
// line box these had was well under the 44px minimum on a phone.
const footerLinkClass = 'text-sm text-slate-500 hover:text-white transition-colors inline-flex items-center min-h-[44px]';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/favicon.png" alt="CipherExam" className="h-7 w-7 rounded object-contain" />
              <span className="text-white font-bold">CipherExam</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-4">
              AI-powered certification exam prep. Understand how exams think.
            </p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className={footerLinkClass}>
              {SUPPORT_EMAIL}
            </a>
          </div>

          {/* Product */}
          <div>
            <h4 className={columnHeaderClass}>Product</h4>
            <ul className="space-y-1 sm:space-y-3">
              <li><a href="/#features" className={footerLinkClass}>Features</a></li>
              <li><Link to="/pricing" className={footerLinkClass}>Pricing</Link></li>
              <li><a href="/#exams" className={footerLinkClass}>Exams</a></li>
              {/* Compare pages are the highest-intent SEO pages on the site and had
                  zero internal links until 2026-09-03. The footer is sitewide, so
                  these two lines alone lift them from orphaned to ~20 inbound. */}
              <li><Link to="/compare/best-pmp-exam-simulator-2026" className={footerLinkClass}>Compare PMP simulators</Link></li>
              <li><Link to="/compare/pocketprep-alternative" className={footerLinkClass}>Pocket Prep alternative</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className={columnHeaderClass}>Company</h4>
            <ul className="space-y-1 sm:space-y-3">
              <li><Link to="/about" className={footerLinkClass}>About</Link></li>
              <li><Link to="/story" className={footerLinkClass}>Our Story</Link></li>
              <li><Link to="/blog" className={footerLinkClass}>Blog</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className={columnHeaderClass}>Legal</h4>
            <ul className="space-y-1 sm:space-y-3">
              <li><Link to="/terms" className={footerLinkClass}>Terms</Link></li>
              <li><Link to="/privacy" className={footerLinkClass}>Privacy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <p className="text-sm text-slate-600 text-center">
            &copy; {new Date().getFullYear()} CipherExam. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
