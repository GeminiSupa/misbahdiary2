import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy • Lawyer Diary",
  description:
    "Privacy Policy for Lawyer Diary — how we collect, use, and protect your data in accordance with applicable laws including PECA 2016 and Pakistani data protection norms.",
};

const LAST_UPDATED = "2026-02-16";

const TOC = [
  { id: "scope", label: "Scope and applicability" },
  { id: "information-collected", label: "Information we collect" },
  { id: "legal-basis", label: "Legal basis and purpose" },
  { id: "retention", label: "Data retention" },
  { id: "third-parties", label: "Third-party services" },
  { id: "security", label: "Security measures" },
  { id: "your-rights", label: "Your rights" },
  { id: "cross-border", label: "Cross-border transfers" },
  { id: "contact", label: "Contact us" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      toc={TOC}
    >
      <p className="text-base leading-relaxed">
        This Privacy Policy explains how Lawyer Diary (&quot;we&quot;, &quot;us&quot;,
        &quot;our&quot;) — operated by Its 4 You / UX4U — collects, uses, stores, and
        protects your personal data when you use our website and services. We are
        committed to protecting your privacy in line with applicable laws of
        Pakistan, including the Prevention of Electronic Crimes Act 2016 (PECA)
        and the Electronic Transactions Ordinance 2002 (ETO), as well as
        emerging norms under the draft Personal Data Protection Bill.
      </p>

      <h2 id="scope">1. Scope and applicability</h2>
      <p>
        This policy applies to all users of Lawyer Diary in Pakistan and elsewhere.
        By using our Service, you consent to the practices described herein. If
        you do not agree, please do not use the Service.
      </p>

      <h2 id="information-collected">2. Information we collect</h2>
      <p>We collect the following categories of data:</p>
      <ul>
        <li>
          <strong>Account and profile data:</strong> Name, email address, phone
          number, and firm affiliation used to create and manage your account.
        </li>
        <li>
          <strong>Practice data:</strong> Client names, case details, court
          information, invoices, and other data you input while using the Service.
        </li>
        <li>
          <strong>Technical and usage data:</strong> IP address, device type,
          browser information, and logs for security, operations, and product
          improvement.
        </li>
        <li>
          <strong>Payment data:</strong> Billing information processed via
          Stripe. We do not store full payment card details on our servers.
        </li>
      </ul>

      <h2 id="legal-basis">3. Legal basis and purpose</h2>
      <p>We process your data for the following purposes:</p>
      <ul>
        <li>Providing authentication, access, and core product features.</li>
        <li>Firm onboarding, team management, and subscription administration.</li>
        <li>Preventing fraud, abuse, and unauthorized access (PECA compliance).</li>
        <li>Fulfilling legal obligations and responding to lawful requests.</li>
        <li>Improving our Service with aggregated, anonymized analytics.</li>
      </ul>

      <h2 id="retention">4. Data retention</h2>
      <p>
        We retain your data only as long as necessary to provide the Service,
        comply with legal obligations (including under PECA and court orders),
        or resolve disputes. Upon account deletion, we remove or anonymize your
        data within a reasonable period, except where retention is required by law.
      </p>

      <h2 id="third-parties">5. Third-party services</h2>
      <p>
        We use trusted third parties for hosting, authentication, and payments:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication and database (data may be
          stored in cloud infrastructure).
        </li>
        <li>
          <strong>Stripe</strong> — payment processing. Stripe&apos;s privacy policy
          governs their handling of payment data.
        </li>
      </ul>
      <p>
        These providers are bound by data processing agreements and applicable
        law. We do not sell your personal data to third parties.
      </p>

      <h2 id="security">6. Security measures</h2>
      <p>
        We implement technical and organizational measures to protect your data
        against unauthorized access, alteration, disclosure, or destruction,
        in line with requirements under PECA 2016. This includes encryption in
        transit and at rest, access controls, and secure development practices.
      </p>

      <h2 id="your-rights">7. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access and receive a copy of your personal data.</li>
        <li>Correct inaccurate or incomplete data.</li>
        <li>Request deletion of your data, subject to legal retention.</li>
        <li>Withdraw consent where processing is consent-based.</li>
        <li>Lodge a complaint with a relevant authority in Pakistan.</li>
      </ul>
      <p>
        To exercise these rights, contact us via the app&apos;s contact page or the
        email provided below.
      </p>

      <h2 id="cross-border">8. Cross-border transfers</h2>
      <p>
        Your data may be processed on servers outside Pakistan. Where we transfer
        data internationally, we ensure appropriate safeguards in accordance
        with applicable law, including any future requirements under the
        Personal Data Protection Bill when enacted.
      </p>

      <h2 id="contact">9. Contact us</h2>
      <p>
        For questions about this Privacy Policy or to exercise your rights:
      </p>
      <ul>
        <li>Use the contact form in the Lawyer Diary app (when logged in).</li>
        <li>Email: support at the domain of this Service.</li>
      </ul>
      <p>
        We will respond to your request within a reasonable time as required by
        applicable law.
      </p>
    </LegalPageLayout>
  );
}
