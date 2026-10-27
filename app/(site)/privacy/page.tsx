import type { Metadata } from "next";
import Link from "next/link";
import { ContactLink, LegalPage } from "@/components/legal/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What personal data ScholarSphere collects, why, who processes it, and how to access or delete it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`How ${SITE.operator} collects, uses and protects your personal data when you use ${SITE.name}.`}
    >
      <h2>Summary</h2>
      <ul>
        <li>We use your profile only to match you with scholarships and remind you of deadlines.</li>
        <li>We do not sell your data, show ads, or share your profile with scholarship providers.</li>
        <li>Most profile fields are optional. You can edit them any time and ask us to delete your account.</li>
      </ul>

      <h2>Data we collect</h2>
      <p>
        <strong>Account details:</strong> your name, email address and password (stored only as a one-way bcrypt hash). If you
        sign in with Google, we receive your name, email address and profile picture from Google.
      </p>
      <p>
        <strong>Student profile:</strong> country, state, education level, course, marks, annual family income, social
        category, minority status, gender, disability status and date of birth. Some of this is sensitive. We ask for it only
        because scholarship eligibility depends on it, and you can leave any optional field blank — you will simply see less
        precise matches.
      </p>
      <p>
        <strong>Activity:</strong> scholarships you save, the status and notes you record in the application tracker, and a log
        of the deadline reminders we have emailed you.
      </p>
      <p>
        <strong>Technical data:</strong> your IP address is used to limit repeated sign-in and sign-up attempts. It is stored
        only in hashed form, for no longer than about a day. Our hosting provider keeps standard server logs for security and
        debugging.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To calculate match scores and explain which eligibility rules you meet or miss.</li>
        <li>To send deadline reminders for scholarships you have saved (you can turn these off in your profile).</li>
        <li>To keep the service secure, prevent abuse and fix problems.</li>
        <li>To understand aggregate usage (for example, how many scholarships are saved) — never to profile you for advertising.</li>
      </ul>
      <p>
        We process your data on the basis of your consent, given when you create an account and fill in your profile. You can
        withdraw consent at any time by deleting your profile data or your account.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        We use only strictly necessary cookies: a session cookie that keeps you signed in, and security cookies used during
        sign-in. Your light/dark theme choice is saved in your browser&apos;s local storage. We do not use advertising or
        third-party tracking cookies.
      </p>

      <h2>Who processes your data</h2>
      <p>We use a small number of service providers who process data on our behalf:</p>
      <ul>
        <li>Vercel — website hosting.</li>
        <li>Neon — database hosting.</li>
        <li>Our email delivery provider — sending deadline reminders.</li>
        <li>Google — only if you choose to sign in with Google.</li>
      </ul>
      <p>
        These providers may store data outside India. When you click &ldquo;Apply&rdquo;, you leave {SITE.name} for the
        provider&apos;s official website; we do not send them your profile, and their own privacy policy applies there.
      </p>

      <h2>Retention</h2>
      <p>
        We keep your account and profile until you delete them or ask us to. After deletion, your data is removed from our live
        database straight away and from backups within 30 days. Reminder logs are deleted together with your account.
      </p>

      <h2>Your rights</h2>
      <p>
        Under India&apos;s Digital Personal Data Protection Act, 2023 and other applicable laws, you can ask to access, correct or
        erase your personal data, withdraw consent, and nominate someone to exercise these rights on your behalf. You can update
        your profile directly on the <Link href="/dashboard/profile">profile page</Link>. For anything else, email{" "}
        <ContactLink /> and we will respond within 30 days.
      </p>

      <h2>Students under 18</h2>
      <p>
        Many scholarships are for school students. If you are under 18, please use {SITE.name} with the knowledge and consent of
        a parent or guardian, who may contact us on your behalf to review or delete your data.
      </p>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit (HTTPS) and at rest by our database provider, passwords are hashed, and admin access is
        restricted and checked on every request. No system is perfectly secure; if we become aware of a breach affecting you, we
        will notify you and the relevant authorities as the law requires.
      </p>

      <h2>Changes</h2>
      <p>
        If we make material changes to this policy we will update the date above and, where appropriate, notify you by email.
      </p>

      <h2>Contact and grievances</h2>
      <p>
        Questions, requests or complaints about your data: <ContactLink />.
      </p>
    </LegalPage>
  );
}
