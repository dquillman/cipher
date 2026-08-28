import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { trackCtaClick } from '../lib/ga4';
import PublicNav from '../components/layout/PublicNav';
import PublicFooter from '../components/layout/PublicFooter';
import SeoHead from '../components/SeoHead';
import { SEO } from '../config/seo';

export default function Story() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  const handleCta = () => {
    trackCtaClick('story');
    if (user) {
      navigate('/app');
    } else {
      navigate('/login?mode=signup');
    }
  };

  return (
    <div className="decoder bg-slate-900 min-h-dvh font-sans selection:bg-brand-500/30 text-slate-200">
      <SeoHead {...SEO.story} />
      <PublicNav />

      {/* Story Content */}
      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6">

          {/* Heading + Photo */}
          <div className="mb-12 flex flex-col items-center text-center">
            {imgError ? (
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center border-2 border-slate-700 shadow-lg shadow-brand-500/10 mb-6">
                <span className="text-4xl font-bold text-white font-display">D</span>
              </div>
            ) : (
              <img
                src="/assets/dave-headshot.jpg"
                alt="Dave — founder of CipherExam"
                className="w-28 h-28 rounded-full object-cover border-2 border-slate-700 shadow-lg shadow-brand-500/10 mb-6"
                onError={() => setImgError(true)}
              />
            )}
            <h1 className="text-4xl font-extrabold text-white font-display tracking-tight sm:text-5xl mb-4">
              Why We Built CipherExam
            </h1>
            <p className="text-slate-500 text-sm">By Dave, founder of CipherExam</p>
          </div>

          {/* Story Body */}
          <article className="prose-custom space-y-6 text-lg leading-relaxed text-slate-300">
            <p>
              If you've ever prepared for a professional certification exam, you probably know the feeling.
            </p>

            <p>
              You read the material. You memorize the terms. You practice the flashcards. You take practice
              questions. And then when you sit down for the real exam, the questions suddenly feel completely
              different from what you studied.
            </p>

            <p>
              That experience is exactly what led to the creation of CipherExam.
            </p>

            <p>
              Most certification exams aren't testing whether you memorized definitions. They're testing
              whether you understand how professionals think through real situations. The questions are
              designed to force you to interpret context, weigh competing answers, and choose the response
              that reflects the mindset the exam expects.
            </p>

            <p className="text-white font-medium">
              But most exam prep tools don't teach that.
            </p>

            <p>
              They focus on memorization.
            </p>

            <p>
              You get a question bank. You answer questions. Maybe you see a short explanation. But rarely
              does anything explain <em>why</em> the correct answer reflects the way the exam wants you to think.
            </p>

            <p>
              That gap is exactly why we built CipherExam.
            </p>

            <p>
              Instead of just telling you whether an answer is correct, CipherExam focuses on the reasoning
              behind it. When you answer a question, the system breaks down the logic behind the correct
              choice and explains how the exam framework approaches the situation. The goal isn't just to
              help you get that question right — it's to help you recognize the thinking pattern behind
              similar questions.
            </p>

            <p>
              Once you start to see those patterns, something interesting happens.
            </p>

            <p className="text-xl text-white font-semibold">
              The exam stops feeling like a trick.
            </p>

            <p>
              You begin to understand the mindset behind the questions, and the answers start making sense.
            </p>

            <p>
              That's the difference between memorizing answers and understanding reasoning.
            </p>

            <p>
              CipherExam was built to teach that reasoning.
            </p>

            <p>
              It's still evolving, and feedback from early users has been incredibly valuable. Many of the
              improvements in the platform come directly from people preparing for certification exams who
              wanted a better way to study.
            </p>

            <p>
              If you're preparing for a certification exam right now, our goal is simple: help you understand
              how the exam thinks, not just what the answer is.
            </p>

            <p className="text-white font-medium text-xl">
              Because once you understand the reasoning, the questions stop feeling impossible.
            </p>
          </article>

          {/* CTA */}
          <div className="mt-16 text-center">
            <button
              onClick={handleCta}
              className="rounded-full bg-brand-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500 transition-colors"
            >
              Start Your Free Trial
            </button>
            <p className="mt-4 text-sm text-slate-500">No credit card required.</p>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
