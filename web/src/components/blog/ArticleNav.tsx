import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Link2, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface ArticleNavProps {
  prevSlug?: string;
  prevTitle?: string;
  nextSlug?: string;
  nextTitle?: string;
}

const shareBtn = 'flex items-center justify-center w-9 h-9 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:border-brand-500/30 transition-colors';

export default function ArticleNav({ prevSlug, prevTitle, nextSlug, nextTitle }: ArticleNavProps) {
  const [copied, setCopied] = useState(false);

  const getUrl = () => window.location.href;

  const shareOnTwitter = () => {
    const url = getUrl();
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(document.title)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareOnLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getUrl())}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(getUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-16 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Share</span>
        <button onClick={shareOnTwitter} className={shareBtn} aria-label="Share on X">
          <Twitter className="w-4 h-4" />
        </button>
        <button onClick={shareOnLinkedIn} className={shareBtn} aria-label="Share on LinkedIn">
          <Linkedin className="w-4 h-4" />
        </button>
        <button onClick={copyLink} className={shareBtn} aria-label="Copy link">
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
        </button>
        {copied && <span className="text-xs text-emerald-400">Copied!</span>}
      </div>

      {/* Prev / Next */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {prevSlug ? (
          <Link
            to={`/blog/${prevSlug}`}
            className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-800/30 p-4 hover:border-brand-500/30 hover:bg-slate-800/50 transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-colors shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-slate-500 mb-1">Previous</div>
              <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                {prevTitle}
              </div>
            </div>
          </Link>
        ) : (
          <div />
        )}
        {nextSlug ? (
          <Link
            to={`/blog/${nextSlug}`}
            className="group flex items-center justify-end gap-3 rounded-xl border border-slate-800 bg-slate-800/30 p-4 hover:border-brand-500/30 hover:bg-slate-800/50 transition-all text-right"
          >
            <div className="min-w-0">
              <div className="text-xs text-slate-500 mb-1">Next</div>
              <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                {nextTitle}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-colors shrink-0" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
