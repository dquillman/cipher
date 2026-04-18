import { Link } from 'react-router-dom';

const columnHeaderClass = 'text-sm font-bold text-slate-300 uppercase tracking-wider mb-4';
const footerLinkClass = 'text-sm text-slate-500 hover:text-white transition-colors';

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
            <a href="mailto:support@cipherexam.com" className={footerLinkClass}>
              support@cipherexam.com
            </a>
          </div>

          {/* Product */}
          <div>
            <h4 className={columnHeaderClass}>Product</h4>
            <ul className="space-y-3">
              <li><a href="/#features" className={footerLinkClass}>Features</a></li>
              <li><Link to="/pricing" className={footerLinkClass}>Pricing</Link></li>
              <li><a href="/#exams" className={footerLinkClass}>Exams</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className={columnHeaderClass}>Company</h4>
            <ul className="space-y-3">
              <li><Link to="/story" className={footerLinkClass}>Our Story</Link></li>
              <li><Link to="/blog" className={footerLinkClass}>Blog</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className={columnHeaderClass}>Legal</h4>
            <ul className="space-y-3">
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
