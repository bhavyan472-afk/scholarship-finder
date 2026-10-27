import type { Metadata } from "next";
import Link from "next/link";
import { ContactLink, LegalPage } from "@/components/legal/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when you use ScholarSphere to discover and track scholarships.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" intro={`The rules for using ${SITE.name}. Please read them before creating an account.`}>
      <h2>1. Agreement</h2>
      <p>
        By using {SITE.name} (the &ldquo;Service&rdquo;), operated by {SITE.operator}, you agree to these Terms and to our{" "}
        <Link href="/privacy">Privacy Policy</Link>. If you do not agree, please do not use the Service.
      </p>

      <h2>2. What the Service does</h2>
      <p>
        {SITE.name} is a free discovery tool. It lists scholarships offered by third parties, estimates how well you match their
        eligibility rules, and helps you track deadlines. We do not award scholarships, process applications, or act on behalf
        of any scholarship provider. See the <Link href="/disclaimer">Disclaimer</Link> for the limits of the information we show.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>Provide accurate information and keep your password confidential. You are responsible for activity on your account.</li>
        <li>If you are under 18, use the Service with a parent or guardian&apos;s consent.</li>
        <li>One person per account. Tell us promptly at <ContactLink /> if you suspect unauthorised access.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>scrape, crawl or bulk-download the Service, or access it through automated means other than public search engines;</li>
        <li>attempt to break, overload, probe or bypass its security or rate limits;</li>
        <li>impersonate others, create accounts in bulk, or use the Service for spam, fraud or anything unlawful;</li>
        <li>copy, resell or republish our scholarship listings or match results as a competing service.</li>
      </ul>

      <h2>5. Your content</h2>
      <p>
        You keep ownership of the notes and profile information you enter. You allow us to store and process them only to
        provide the Service to you.
      </p>

      <h2>6. Our content</h2>
      <p>
        The Service&apos;s design, code, match logic and compiled listings belong to {SITE.operator}. Scholarship names and logos
        belong to their respective owners.
      </p>

      <h2>7. Third-party websites</h2>
      <p>
        &ldquo;Apply&rdquo; links take you to official provider websites we do not control. Their terms and privacy policies apply
        there, and we are not responsible for their content, availability or decisions.
      </p>

      <h2>8. No warranty</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the extent permitted by law, we make no
        warranty that listings are complete, accurate or current, that match scores are correct, or that the Service will be
        uninterrupted or error-free.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the extent permitted by law, {SITE.operator} is not liable for any indirect or consequential loss, or for any loss
        arising from a missed deadline, an unsuccessful application, or reliance on information shown in the Service. Nothing in
        these Terms limits liability that cannot be limited by law.
      </p>

      <h2>10. Suspension and termination</h2>
      <p>
        You may stop using the Service and ask us to delete your account at any time. We may suspend or close accounts that
        breach these Terms or put the Service or other users at risk.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these Terms. If changes are material we will update the date above and, where appropriate, notify you.
        Continuing to use the Service after changes take effect means you accept them.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of {SITE.jurisdiction}, and disputes are subject to the jurisdiction of its courts.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms: <ContactLink />.
      </p>
    </LegalPage>
  );
}
