import type { Metadata } from "next";
import { ContactLink, LegalPage } from "@/components/legal/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "ScholarSphere is an independent discovery tool. Always confirm scholarship details on the official website.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      intro={`${SITE.name} helps you discover scholarships. The official provider always has the final word.`}
    >
      <h2>Independent service</h2>
      <p>
        {SITE.name} is not affiliated with, endorsed by, or acting for any government department, the National Scholarship
        Portal, any state portal, university, foundation or company whose scholarships appear here, unless we clearly say so.
      </p>

      <h2>Information may change</h2>
      <p>
        We summarise scholarship details from official sources, but providers change amounts, eligibility rules, documents and
        deadlines — sometimes without notice. Each scholarship page shows when our team <strong>last verified</strong> it.
        Always confirm the current details on the official website before you apply or make any decision.
      </p>

      <h2>Match scores are estimates</h2>
      <p>
        Match scores and eligibility checks are calculated automatically from the information you enter and the rules we have
        recorded. They are a guide, not a decision. A high score does not guarantee eligibility or an award, and a low score does
        not mean you cannot apply. Only the scholarship provider decides who is eligible and who receives an award.
      </p>

      <h2>Reminders are a convenience</h2>
      <p>
        Deadline reminders may be delayed, filtered as spam, or not sent. Please keep track of important deadlines yourself.
      </p>

      <h2>We never charge you or ask for sensitive credentials</h2>
      <p>
        {SITE.name} is free. We will never ask you to pay a fee to receive a scholarship, or ask for your bank PIN, OTP, card
        details or portal passwords. Genuine scholarships do not require payment to an intermediary. If someone claiming to be
        us asks for money or such details, do not respond, and report it to us and at cybercrime.gov.in.
      </p>

      <h2>Not professional advice</h2>
      <p>
        Nothing on {SITE.name} is legal, financial or admissions advice. For decisions about your education or finances, consult
        your institution, the scholarship provider or a qualified adviser.
      </p>

      <h2>Spotted an error?</h2>
      <p>
        If a listing is wrong or out of date, please tell us at <ContactLink /> so we can correct it for everyone.
      </p>
    </LegalPage>
  );
}
