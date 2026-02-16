import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service • Lawyer Diary",
};

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toISOString().slice(0, 10)}
      </p>

      <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none">
        <p>
          These Terms of Service (“Terms”) govern your use of Lawyer Diary (the
          “Service”). By using the Service, you agree to these Terms.
        </p>

        <h2>Accounts</h2>
        <ul>
          <li>You must provide accurate information and keep your account secure.</li>
          <li>You are responsible for activity under your account.</li>
        </ul>

        <h2>Trial and subscription</h2>
        <ul>
          <li>New accounts may receive a 30-day free trial (as configured).</li>
          <li>
            After the trial ends, access to protected features may be restricted
            until you subscribe.
          </li>
        </ul>

        <h2>Acceptable use</h2>
        <ul>
          <li>No abuse, reverse engineering, or unauthorized access attempts.</li>
          <li>No illegal content or use that violates applicable laws.</li>
        </ul>

        <h2>Data</h2>
        <p>
          You retain ownership of your data. You grant us permission to process
          it to provide the Service.
        </p>

        <h2>Disclaimer</h2>
        <p>
          The Service is provided “as is” without warranties of any kind to the
          maximum extent permitted by law.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for indirect
          or consequential damages arising from your use of the Service.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use means you
          accept the updated Terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Contact support via the app’s contact page.
        </p>
      </div>
    </main>
  );
}

