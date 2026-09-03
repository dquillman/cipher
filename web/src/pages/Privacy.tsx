import { Link } from 'react-router-dom';
import PublicNav from '../components/layout/PublicNav';
import PublicFooter from '../components/layout/PublicFooter';
import SeoHead from '../components/SeoHead';
import { SEO } from '../config/seo';

export default function Privacy() {
  return (
    <div className="decoder bg-slate-900 min-h-dvh font-sans selection:bg-brand-500/30 text-slate-200">
      {/* Without this the page ships the homepage's <title>, description and a
          canonical pointing at "/" — i.e. it tells Google it IS the homepage. */}
      <SeoHead {...SEO.privacy} />
      <PublicNav />

      <main className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-8">
            <Link to="/" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              &larr; Back to CipherExam
            </Link>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 mb-12">Last updated: March 19, 2026</p>

          <div className="space-y-8 text-base text-slate-300 leading-relaxed">

            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
              <p>
                AdaptiGrowth ("we," "us," "our") operates CipherExam ("the Service").
                This Privacy Policy explains how we collect, use, disclose, and protect your personal
                information when you use the Service.
              </p>
              <p className="mt-3">
                By using CipherExam, you agree to the collection and use of information in accordance with
                this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>

              <h3 className="text-lg font-semibold text-slate-200 mt-4 mb-2">Account Information</h3>
              <p>
                When you create an account, we collect your name, email address, and authentication
                credentials through Google Sign-In. We do not store your Google password.
              </p>

              <h3 className="text-lg font-semibold text-slate-200 mt-4 mb-2">Usage Data</h3>
              <p>
                We collect data about how you use CipherExam, including questions answered, quiz results,
                study session duration, feature usage, and performance analytics. This data powers your
                personalized study experience and performance tracking.
              </p>

              <h3 className="text-lg font-semibold text-slate-200 mt-4 mb-2">Analytics Data</h3>
              <p>
                We use Google Analytics 4 (GA4) to understand how visitors interact with our website.
                This includes page views, session duration, referral sources, and device information.
                We also use Meta Pixel and LinkedIn Insight Tag for advertising measurement. These tools
                may use cookies and similar technologies.
              </p>

              <h3 className="text-lg font-semibold text-slate-200 mt-4 mb-2">Payment Information</h3>
              <p>
                Subscription payments are processed by Stripe. We do not store your credit card number,
                CVV, or full payment details on our servers. Stripe handles all payment information in
                accordance with PCI-DSS standards.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
              <p>We use collected information to:</p>
              <ul className="mt-3 space-y-2 pl-1">
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Provide and maintain the Service, including personalized study recommendations</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Track your performance and generate analytics dashboards</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Process subscription payments and manage your account</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Send service-related communications (account updates, billing notices)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Improve the Service based on aggregate usage patterns</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Measure advertising effectiveness through analytics platforms</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Data Storage and Security</h2>
              <p>
                Your data is stored in Google Cloud (Firebase/Firestore) with encryption at rest and in
                transit. We implement industry-standard security measures including authenticated API access,
                role-based Firestore security rules, and HTTPS-only connections.
              </p>
              <p className="mt-3">
                While we take reasonable steps to protect your data, no method of electronic storage or
                transmission is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Data Sharing</h2>
              <p>We do not sell your personal information. We share data only with:</p>
              <ul className="mt-3 space-y-2 pl-1">
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span><strong className="text-white">Firebase / Google Cloud</strong> — for authentication, data storage, and hosting</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span><strong className="text-white">Stripe</strong> — for payment processing</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span><strong className="text-white">Google Analytics, Meta, LinkedIn</strong> — for anonymized website analytics and advertising measurement</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span><strong className="text-white">AI providers</strong> — question context is sent to AI services to generate explanations (no personally identifiable information is included)</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">6. Cookies and Tracking</h2>
              <p>
                CipherExam uses cookies and similar technologies for authentication, analytics, and
                advertising measurement. You can manage cookie preferences through your browser settings.
                Disabling cookies may affect the functionality of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="mt-3 space-y-2 pl-1">
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Access the personal data we hold about you</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Request correction of inaccurate data</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Request deletion of your account and associated data</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Export your quiz history and performance data</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-brand-400 font-bold shrink-0">&rarr;</span>
                  <span>Opt out of marketing communications</span>
                </li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at{' '}
                <a href="mailto:privacy@cipherexam.com" className="text-brand-400 hover:text-brand-300 transition-colors">
                  privacy@cipherexam.com
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">8. Children's Privacy</h2>
              <p>
                CipherExam is not directed to children under the age of 16. We do not knowingly collect
                personal information from children. If you believe a child has provided us with personal
                information, please contact us so we can take appropriate action.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">9. Data Retention</h2>
              <p>
                We retain your account data for as long as your account is active. If you delete your
                account, we will remove your personal data within 30 days, except where retention is
                required by law or for legitimate business purposes (e.g., billing records).
              </p>
              <p className="mt-3">
                Anonymized and aggregated data that cannot be used to identify you may be retained
                indefinitely for analytics and service improvement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">10. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material
                changes by updating the "Last updated" date. We encourage you to review this policy
                periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">11. Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy or our data practices,
                contact us at{' '}
                <a href="mailto:privacy@cipherexam.com" className="text-brand-400 hover:text-brand-300 transition-colors">
                  privacy@cipherexam.com
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
