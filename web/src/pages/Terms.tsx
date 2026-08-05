import { Link } from 'react-router-dom';
import PublicNav from '../components/layout/PublicNav';
import PublicFooter from '../components/layout/PublicFooter';

export default function Terms() {
  return (
    <div className="decoder bg-slate-900 min-h-screen font-sans selection:bg-brand-500/30 text-slate-200">
      <PublicNav />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-8">
            <Link to="/" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              &larr; Back to CipherExam
            </Link>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 mb-12">Last updated: July 16, 2026</p>

          <div className="space-y-8 text-base text-slate-300 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using CipherExam ("the Service"), operated by AdaptiGrowth
                ("we," "us," "our"), you agree to be bound by these Terms of Service. If you do not agree to
                these terms, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
              <p>
                CipherExam is an AI-powered certification exam preparation platform. We provide practice
                questions, AI-generated explanations, performance analytics, and study planning tools for
                professional certification exams including but not limited to PMP, CompTIA Security+, CSM,
                SHRM-CP, ITIL 4, and others.
              </p>
              <p className="mt-3">
                CipherExam is a study aid. We do not guarantee that using the Service will result in passing
                any certification exam. Exam outcomes depend on many factors beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. Accounts and Registration</h2>
              <p>
                You must create an account to access the Service. You are responsible for maintaining the
                confidentiality of your account credentials and for all activities that occur under your
                account. You agree to provide accurate and complete information when registering and to
                keep your account information up to date.
              </p>
              <p className="mt-3">
                You must be at least 16 years of age to use the Service. By creating an account, you
                represent that you meet this requirement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Free Trial and Subscription</h2>
              <p>
                CipherExam offers a free 7-day trial for new users. No credit card is required to start a
                trial. After the trial period, continued access to premium features requires a paid
                subscription.
              </p>
              <p className="mt-3">
                Subscription fees are billed monthly in advance. You may cancel your subscription at any
                time. Cancellation takes effect at the end of the current billing period. The Exam Pass is a
                one-time purchase covering a single exam for 90 days; it does not renew.
              </p>
              <p className="mt-3">
                Pro purchases include a 60-day money-back guarantee: email us within 60 days of your first
                payment and we&apos;ll refund everything you&apos;ve paid, no conditions. Outside that window,
                cancellations take effect at period end without prorated refunds.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="mt-3 space-y-2 pl-1">
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Share, redistribute, or resell exam questions or AI-generated explanations from the Service</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Attempt to reverse-engineer, scrape, or extract data from the Service</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Use the Service to violate any certification body's code of conduct or exam policies</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Share your account credentials with others or allow multiple people to use a single account</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Use automated tools, bots, or scripts to interact with the Service</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Intellectual Property</h2>
              <p>
                All content on CipherExam, including questions, explanations, user interface design, and
                underlying software, is the property of AdaptiGrowth or its licensors. You may not copy,
                modify, distribute, or create derivative works based on this content without our written
                permission.
              </p>
              <p className="mt-3">
                Certification names (PMP, CompTIA, SHRM-CP, etc.) are trademarks of their respective
                organizations. CipherExam is an independent study tool and is not affiliated with, endorsed
                by, or sponsored by any certification body.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. AI-Generated Content</h2>
              <p>
                CipherExam uses artificial intelligence to generate explanations and study recommendations.
                While we strive for accuracy, AI-generated content may occasionally contain errors or
                inaccuracies. The Service is intended as a study aid and should not be your sole source
                of exam preparation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, AdaptiGrowth shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, including loss of profits, data,
                or other intangible losses, resulting from your use of or inability to use the Service.
              </p>
              <p className="mt-3">
                Our total liability for any claim arising from or related to these Terms or the Service
                shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account if you violate these Terms.
                You may delete your account at any time by contacting us. Upon termination, your right to
                use the Service ceases immediately, and we may delete your account data in accordance with
                our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. If we make material changes, we will notify
                you by updating the "Last updated" date and, where appropriate, providing additional notice
                through the Service. Your continued use of CipherExam after changes take effect constitutes
                acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">11. Contact</h2>
              <p>
                If you have questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:support@cipherexam.com" className="text-brand-400 hover:text-brand-300 transition-colors">
                  support@cipherexam.com
                </a>.
              </p>
            </section>

          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
