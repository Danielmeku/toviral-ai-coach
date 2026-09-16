import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Navigation Header */}
      <header className="relative z-10 max-w-5xl w-full mx-auto px-6 py-2 flex items-center justify-between border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3 font-bold text-white">
          <Image
            src="/logo.png"
            alt="ToViral AI Logo"
            width={140}
            height={40}
            className="h-10 w-auto object-contain"
          />
        </Link>
        <Link
          href="/dashboard"
          className="text-xs font-semibold px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all duration-200"
        >
          Back
        </Link>
      </header>

      {/* Main Document Body */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mt-2">Last updated: September 2026</p>
        </div>

        <div className="space-y-8 text-sm sm:text-base text-gray-300 leading-relaxed border-t border-white/10 pt-8">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500 font-mono text-sm">01.</span> Information We Collect via the TikTok API
            </h2>
            <p>
              When you authorize <strong className="text-white">ToViral AI Coach</strong> to connect to your TikTok account, we access and collect specific information authorized by you via the official TikTok Developer API. The types of data we may collect include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong className="text-white">Account & Profile Data:</strong> Public profile details, such as your display name, username, and unique account identifiers.</li>
              <li><strong className="text-white">Content & Performance Data:</strong> Metadata related to your videos, such as upload timestamps, view counts, like counts, share counts, comment counts, and caption text.</li>
              <li><strong className="text-white">Access Tokens:</strong> Secure OAuth authorization tokens provided by TikTok to maintain your connection.</li>
            </ul>
            <p className="text-xs text-blue-400 bg-blue-950/30 p-3 rounded-lg border border-blue-500/20">
              🔒 We never collect, request, or store your personal TikTok password or financial credentials.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500 font-mono text-sm">02.</span> How We Use TikTok Data
            </h2>
            <p>
              We collect and process your TikTok data strictly to provide and improve the functionality of ToViral AI Coach. Specifically, this data is used to:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-400">
              <li>Display your connected account information and performance metrics within our dashboard.</li>
              <li>Enable authorized posting or video management features requested by you.</li>
              <li>Provide analytics, retention trends, and AI-driven performance insights related to your content.</li>
            </ul>
            <p>
              <strong className="text-white">We do not sell, rent, or trade your TikTok data to third-party advertisers or data brokers.</strong>
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500 font-mono text-sm">03.</span> Data Storage & Security Measures
            </h2>
            <p>We prioritize the security of your information using enterprise standards:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong className="text-white">Storage:</strong> Data retrieved from TikTok is stored in encrypted databases using industry-standard protocols (such as AES-256 encryption at rest and TLS 1.3 encryption in transit via Supabase).</li>
              <li><strong className="text-white">Access Controls:</strong> Access to stored data is restricted strictly to authorized automated systems necessary to operate our service.</li>
              <li><strong className="text-white">Retention:</strong> We retain your TikTok data only for as long as your TikTok account remains connected to ToViral AI, or as needed to maintain active app features.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-blue-500 font-mono text-sm">04.</span> Account Disconnection & Data Deletion Rights
            </h2>
            <p>
              You retain complete control over your TikTok data. You may disconnect your account or request the complete erasure of your data at any time:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><strong className="text-white">In-App Disconnection:</strong> You can revoke access at any time directly through your TikTok account settings (<em className="text-gray-300">Settings and Privacy &gt; Security &gt; Authorized Apps</em>) or within our application settings.</li>
              <li><strong className="text-white">Data Deletion Request:</strong> You retain complete control over your data. You can permanently delete your ToViral AI account, disconnect your TikTok profile, and erase all associated metrics and access tokens at any time by navigating to your <strong className="text-white">Account Settings</strong> inside the dashboard and clicking <strong className="text-white">"Delete Account & Data"</strong>.</li>
              <li><strong className="text-white">Automatic Deletion:</strong> Upon receiving a revocation event or a valid deletion request, all personal data and access tokens associated with your TikTok account will be permanently erased from our primary databases within 30 days.</li>
            </ul>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-xs text-gray-500 space-y-2">
        <p>&copy; {new Date().getFullYear()} ToViral AI. All rights reserved.</p>
        <div className="flex justify-center gap-4 text-gray-400">
          <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
          <span>&bull;</span>
          <Link href="/privacy" className="text-blue-400 font-semibold">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
