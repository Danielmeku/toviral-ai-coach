import Link from 'next/link';
import Image from 'next/image';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Navigation Header */}
      <header className="relative z-10 max-w-5xl w-full mx-auto px-6 py-1 flex items-center justify-between border-b border-white/10">
        <Link href="/" className="flex items-center gap-3 font-bold text-white">
          <Image
            src="/logo.png"
            alt="ToViral AI Logo"
            width={200}
            height={160}
            className="rounded-lg object-contain"
          />
        </Link>
        <Link
          href="/login"
          className="text-xs font-semibold px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all duration-200"
        >
          Back
        </Link>
      </header>

      {/* Main Document Body */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Terms of Service</h1>
          <p className="text-sm text-gray-400 mt-2">Last updated: September 2026</p>
        </div>

        <div className="space-y-8 text-sm sm:text-base text-gray-300 leading-relaxed border-t border-white/10 pt-8">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500 font-mono text-sm">01.</span> Acceptance of Terms
            </h2>
            <p>
              By connecting your TikTok account to <strong className="text-white">ToViral AI</strong> or utilizing any TikTok-related features within our platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not authorize or use ToViral AI’s TikTok integration.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500 font-mono text-sm">02.</span> Relationship with TikTok & Third-Party Terms
            </h2>
            <p>
              <strong className="text-white">ToViral AI</strong> is an independent service that utilizes official API integrations provided by TikTok.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong className="text-white">No Affiliation:</strong> ToViral AI is not endorsed, sponsored, directly affiliated with, or maintained by TikTok, ByteDance, or any of their affiliates.</li>
              <li><strong className="text-white">Compliance with TikTok Terms:</strong> By using our platform to interact with TikTok, you acknowledge and agree that your usage is also governed by TikTok’s official policies, including the TikTok Terms of Service and TikTok Community Guidelines.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500 font-mono text-sm">03.</span> User Authorization & Account Responsibility
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong className="text-white">OAuth Permissions:</strong> You grant ToViral AI permission to access and process data from your TikTok account solely in accordance with the permissions (scopes) you approve during the OAuth login flow.</li>
              <li><strong className="text-white">Account Security:</strong> You are solely responsible for maintaining the security of your account credentials and for all activities that occur under your authorized connection.</li>
              <li><strong className="text-white">Revocation of Access:</strong> You may revoke ToViral AI’s access to your TikTok account at any time through your TikTok security settings (<em className="text-gray-300">Settings and Privacy &gt; Security &gt; Authorized Apps</em>).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500 font-mono text-sm">04.</span> Prohibited Uses & Community Guidelines
            </h2>
            <p>When using ToViral AI in connection with your TikTok account, you explicitly agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Use our service to generate automated spam, misleading content, or engage in artificial engagement manipulation (e.g., fake likes or mass follow/unfollow schemes).</li>
              <li>Upload, schedule, or publish any content via our platform that violates intellectual property rights, privacy rights, or TikTok’s Community Guidelines.</li>
              <li>Attempt to reverse-engineer, exploit, or disrupt ToViral AI's API integration or server infrastructure.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500 font-mono text-sm">05.</span> Limitation of Liability & Service Modifications
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong className="text-white">API Availability:</strong> ToViral AI relies on third-party APIs (including TikTok) to deliver certain features. We are not responsible for service interruptions, API rate limits, feature deprecations, or outages caused directly by third-party providers.</li>
              <li><strong className="text-white">Changes to Features:</strong> We reserve the right to modify, suspend, or discontinue any TikTok-related features or API endpoints at any time without prior notice if required by updates to TikTok’s Developer Policies.</li>
              <li><strong className="text-white">Disclaimer:</strong> All services and data insights are provided on an <strong className="text-white font-mono text-xs">"AS IS"</strong> and <strong className="text-white font-mono text-xs">"AS AVAILABLE"</strong> basis without warranties of any kind, either express or implied.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500 font-mono text-sm">06.</span> Account Termination
            </h2>
            <p>
              We reserve the right to terminate or suspend your access to ToViral AI immediately, without prior notice, if we determine that you have violated these Terms of Service, infringed upon third-party rights, or misused the TikTok API integration.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-xs text-gray-500 space-y-2">
        <p>&copy; {new Date().getFullYear()} ToViral AI. All rights reserved.</p>
        <div className="flex justify-center gap-4 text-gray-400">
          <Link href="/terms" className="text-blue-400 font-semibold">Terms of Service</Link>
          <span>&bull;</span>
          <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
