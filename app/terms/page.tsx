import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms of Service • Lawyer Diary",
  description:
    "Terms of Service for Lawyer Diary — governing your use of our legal practice management platform in Pakistan, including trial, subscription, and acceptable use.",
};

const LAST_UPDATED = "2026-02-16";

const TOC = [
  { id: "acceptance", label: "Acceptance of terms" },
  { id: "description", label: "Description of service" },
  { id: "accounts", label: "Accounts and eligibility" },
  { id: "trial-subscription", label: "Trial and subscription" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "data-ownership", label: "Data ownership and licence" },
  { id: "disclaimer", label: "Disclaimer" },
  { id: "limitation", label: "Limitation of liability" },
  { id: "termination", label: "Termination" },
  { id: "governing-law", label: "Governing law and jurisdiction" },
  { id: "changes", label: "Changes to terms" },
  { id: "contact", label: "Contact" },
];

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated={LAST_UPDATED}
      toc={TOC}
    >
      <p className="text-base leading-relaxed">
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of
        Lawyer Diary (the &quot;Service&quot;) operated by Its 4 You / UX4U. By
        creating an account or using the Service, you agree to be bound by these
        Terms. If you are using the Service on behalf of a law firm or
        organisation, you represent that you have authority to bind that entity.
      </p>

      <h2 id="acceptance">1. Acceptance of terms</h2>
      <p>
        By accessing or using Lawyer Diary, you acknowledge that you have read,
        understood, and agree to these Terms and our Privacy Policy. These Terms
        constitute a legally binding agreement between you and us under the
        contract law of Pakistan and the Electronic Transactions Ordinance 2002
        (ETO).
      </p>

      <h2 id="description">2. Description of service</h2>
      <p>
        Lawyer Diary is a cloud-based legal practice management platform designed
        for advocates and law firms in Pakistan. It provides case management,
        billing and invoicing (including PKR and GST support), calendar and
        hearing scheduling, and related features. We reserve the right to modify,
        suspend, or discontinue any part of the Service with reasonable notice.
      </p>

      <h2 id="accounts">3. Accounts and eligibility</h2>
      <ul>
        <li>
          You must be at least 18 years old and legally capable of entering into
          a contract to use the Service.
        </li>
        <li>
          You must provide accurate, current, and complete information when
          registering and maintain the security of your account credentials.
        </li>
        <li>
          You are responsible for all activity under your account. Notify us
          immediately of any unauthorized access.
        </li>
        <li>
          Use of the Service for legal practice in Pakistan implies that you are
          a qualified advocate or operate under appropriate professional
          authorisation where applicable.
        </li>
      </ul>

      <h2 id="trial-subscription">4. Trial and subscription</h2>
      <ul>
        <li>
          New accounts may receive a free trial period as specified at
          registration. Trial terms may vary.
        </li>
        <li>
          After the trial ends, continued access requires an active subscription.
          Subscription plans, pricing (in PKR or other currencies), and billing
          cycles are set out at the time of purchase.
        </li>
        <li>
          Payments are processed via Stripe. You agree to provide valid payment
          details and authorise recurring charges where applicable.
        </li>
        <li>
          Refunds, if any, are governed by our subscription and billing policies
          and applicable consumer protection norms in Pakistan.
        </li>
      </ul>

      <h2 id="acceptable-use">5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          Use the Service for any unlawful purpose or in violation of any
          applicable law, including but not limited to the laws of Pakistan,
          the Prevention of Electronic Crimes Act 2016 (PECA), or the Electronic
          Transactions Ordinance 2002 (ETO).
        </li>
        <li>
          Attempt to gain unauthorized access to the Service, other accounts, or
          our systems (such conduct may attract liability under PECA).
        </li>
        <li>
          Reverse engineer, decompile, or disassemble the Service, except where
          expressly permitted by law.
        </li>
        <li>
          Upload, store, or transmit content that infringes intellectual
          property rights, defames, harasses, or is otherwise objectionable.
        </li>
        <li>
          Use the Service to transmit malware, spam, or conduct phishing or
          similar activities.
        </li>
      </ul>
      <p>
        We reserve the right to suspend or terminate accounts that violate these
        terms or pose a security risk.
      </p>

      <h2 id="data-ownership">6. Data ownership and licence</h2>
      <p>
        You retain ownership of the data you input into the Service (client
        information, case files, invoices, etc.). By using the Service, you grant
        us a non-exclusive, royalty-free licence to host, process, and display
        that data solely to provide and improve the Service. We do not claim
        ownership of your practice data. Our handling of personal data is
        governed by our Privacy Policy and applicable data protection norms.
      </p>

      <h2 id="disclaimer">7. Disclaimer</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;.
        To the maximum extent permitted by law, we disclaim all warranties,
        express or implied, including merchantability, fitness for a particular
        purpose, and non-infringement. Lawyer Diary is a practice management
        tool and does not constitute legal advice. You are responsible for
        ensuring your use of the Service complies with your professional
        obligations and local regulations.
      </p>

      <h2 id="limitation">8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by applicable law (including the
        Contract Act 1872 and related laws of Pakistan), we shall not be liable
        for any indirect, incidental, special, consequential, or punitive
        damages, including loss of profits, data, or business opportunity,
        arising from or related to your use of the Service. Our aggregate
        liability shall not exceed the amount you paid us in the twelve (12)
        months preceding the claim. Some jurisdictions do not allow the
        exclusion of certain warranties or limitation of liability; in such
        cases, our liability shall be limited to the fullest extent permitted
        by law.
      </p>

      <h2 id="termination">9. Termination</h2>
      <p>
        You may close your account at any time. We may suspend or terminate
        your access for violation of these Terms, non-payment, or for other
        reasons with reasonable notice where practicable. Upon termination,
        your right to use the Service ceases. We will retain or delete your
        data in accordance with our Privacy Policy and applicable law.
      </p>

      <h2 id="governing-law">10. Governing law and jurisdiction</h2>
      <p>
        These Terms are governed by the laws of Pakistan. Any dispute arising
        out of or in connection with these Terms or the Service shall be
        subject to the exclusive jurisdiction of the courts of Pakistan. You
        agree to submit to the jurisdiction of such courts.
      </p>

      <h2 id="changes">11. Changes to terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of
        material changes by posting the updated Terms on this page and updating
        the &quot;Last updated&quot; date. Your continued use of the Service
        after such changes constitutes acceptance of the revised Terms. If you
        do not agree, you must stop using the Service.
      </p>

      <h2 id="contact">12. Contact</h2>
      <p>
        For questions about these Terms of Service:
      </p>
      <ul>
        <li>Use the contact form in the Lawyer Diary app (when logged in).</li>
        <li>Email: support at the domain of this Service.</li>
      </ul>
    </LegalPageLayout>
  );
}
