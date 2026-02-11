import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto max-w-2xl flex-1 px-4 py-12">
        <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          Terms & Conditions
        </h1>
        <div className="space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          <p>
            <strong>Last updated:</strong> February 2026
          </p>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Service Description
            </h2>
            <p>
              ShareClaude is an AI-powered game idea intake tool. It uses
              Claude, an AI assistant by Anthropic, to guide you through a
              structured interview process to capture your game concept and
              produce a development brief.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              SMS Terms
            </h2>
            <p>
              SMS usage alerts are sent to the site administrator only. These
              messages include:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Usage threshold notifications (message counts, costs)</li>
              <li>Up to 4 SMS messages per day</li>
              <li>Reply STOP to cancel SMS notifications at any time</li>
              <li>Reply HELP for SMS support</li>
              <li>Message and data rates may apply</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Acceptable Use
            </h2>
            <p>When using this service, you agree not to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Submit abusive, harmful, or illegal content</li>
              <li>Attempt to bypass rate limits or authentication</li>
              <li>Use the service for purposes other than game idea development</li>
              <li>Share the access password with unauthorized individuals</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Intellectual Property
            </h2>
            <p>
              You retain full ownership of all game ideas, concepts, and
              creative content you submit through this service. The AI-generated
              responses (including the development brief) are provided as tools
              to help articulate your ideas and do not transfer any IP rights.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Disclaimer
            </h2>
            <p>
              AI-generated responses are not professional advice. The
              development briefs produced are starting points for further
              refinement, not production specifications. The AI may produce
              inaccurate or incomplete suggestions.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Limitation of Liability
            </h2>
            <p>
              This service is provided &quot;as is&quot; without warranties of
              any kind. The site operator is not liable for any damages arising
              from your use of the service, including but not limited to loss
              of data, interruptions, or inaccuracies in AI responses.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Data Handling
            </h2>
            <p>
              Your data is handled as described in our{" "}
              <a href="/privacy" className="underline">
                Privacy Policy
              </a>
              . Chat data expires automatically. We do not sell your data.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Service Availability
            </h2>
            <p>
              There is no guarantee of uptime or availability. The service may
              be modified, suspended, or discontinued at any time without
              notice. Daily usage limits are enforced to manage costs.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Modifications
            </h2>
            <p>
              These terms may be updated at any time. Continued use of the
              service constitutes acceptance of any changes.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
