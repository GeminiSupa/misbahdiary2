import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy • Lawyer Diary",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {new Date().toISOString().slice(0, 10)}
      </p>

      <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none">
        <p>
          This Privacy Policy explains how Lawyer Diary (“we”, “us”) collects,
          uses, and protects your information when you use our website and
          services.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>Account details (email, name) used to create and manage access.</li>
          <li>
            Usage data (basic logs) to operate, secure, and improve the service.
          </li>
          <li>
            Billing information (via Stripe) if you subscribe; we do not store
            full card details on our servers.
          </li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>Provide authentication and access to the app.</li>
          <li>Provide onboarding, firm setup, and core product features.</li>
          <li>Enforce trials/subscriptions and send transactional emails.</li>
          <li>Prevent abuse, fraud, and unauthorized access.</li>
        </ul>

        <h2>Data retention</h2>
        <p>
          We retain information as needed to provide the service and comply with
          legal obligations. You can request deletion by contacting us.
        </p>

        <h2>Third-party services</h2>
        <p>
          We use third-party providers for key functionality (e.g., Supabase for
          authentication/database and Stripe for payments). Their processing is
          governed by their respective policies.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>You can update your profile information in the app.</li>
          <li>You can request account deletion by contacting us.</li>
        </ul>

        <h2>Contact</h2>
        <p>
          If you have questions about this policy, contact support via the app’s
          contact page.
        </p>
      </div>
    </main>
  );
}

