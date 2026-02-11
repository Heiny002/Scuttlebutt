import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto max-w-2xl flex-1 px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          Privacy Policy
        </h1>
        <div className="space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <p>
            <strong>Last updated:</strong> February 2026
          </p>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              What Data We Collect
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Chat messages you send during your game idea intake session
              </li>
              <li>
                Images you upload as reference material for your game concept
              </li>
              <li>
                Usage data (message counts, session timestamps) for rate
                limiting
              </li>
              <li>A session cookie for authentication (no personal login data)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              How We Use Your Data
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Powering the AI chat experience to capture your game idea
              </li>
              <li>
                Building a structured development brief from your concept
              </li>
              <li>Tracking usage to enforce daily limits and manage costs</li>
              <li>
                Sending SMS usage alerts to the site administrator (not to you)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Data Storage & Retention
            </h2>
            <p>
              Your chat conversations are stored in Vercel KV and expire
              automatically after 72 hours. Uploaded images are stored in
              Vercel Blob storage and retained for project development purposes.
              We do not store any personal account information — authentication
              uses a shared password with a session cookie.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Third-Party Services
            </h2>
            <p>Your data is processed by the following services:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Anthropic (Claude)</strong> — AI chat responses. Subject
                to{" "}
                <a
                  href="https://www.anthropic.com/privacy"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Anthropic&apos;s Privacy Policy
                </a>
              </li>
              <li>
                <strong>Vercel</strong> — Hosting, data storage (KV and Blob)
              </li>
              <li>
                <strong>Twilio</strong> — SMS notifications sent to the site
                administrator only
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              SMS Disclosures
            </h2>
            <p>
              SMS notifications are sent only to the site administrator for
              usage monitoring. If you are the administrator receiving SMS
              alerts:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Message frequency: Up to 4 messages per day</li>
              <li>Message and data rates may apply</li>
              <li>Reply STOP to opt out of SMS notifications</li>
              <li>Reply HELP for assistance</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Your Rights
            </h2>
            <p>
              You may request deletion of your data or access to data we hold
              about your session by contacting the site administrator. We do
              not sell your data to any third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Contact
            </h2>
            <p>
              For privacy questions, contact the site administrator through
              the same channel that provided you with the access password.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
