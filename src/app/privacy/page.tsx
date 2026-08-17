import { Container } from "@/components/container";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How Toronto App Developers collects, uses, and protects personal information.",
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-14">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: August 2026</p>

      <div className="prose-directory mt-8 space-y-6 text-slate-600 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1">
        <p>
          Toronto App Developers (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates
          appdevelopmenttoronto.com, a directory of app development companies in
          the Greater Toronto Area. This policy explains what personal
          information we handle and your rights under Canada&rsquo;s Personal
          Information Protection and Electronic Documents Act (PIPEDA).
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Directory listings.</strong> Company profiles are compiled
            from publicly available business information (including Google&rsquo;s
            Places data) — company name, website, address, and public ratings.
          </li>
          <li>
            <strong>Account information.</strong> When you claim a profile, we
            store your email address to authenticate you.
          </li>
          <li>
            <strong>Enquiries.</strong> When you request a call about paid
            features, we collect the name, email, phone number, and message you
            provide.
          </li>
          <li>
            <strong>Technical data.</strong> We store a one-way hash of your IP
            address (not the address itself) to prevent spam and abuse.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To operate and display the directory.</li>
          <li>To verify profile claims and let owners manage their listings.</li>
          <li>To respond to your enquiries and provide paid features.</li>
          <li>To protect the service from spam and abuse.</li>
        </ul>

        <h2>Service providers</h2>
        <p>
          We share limited data with providers who help us run the service:
          Vercel (hosting), Supabase (database &amp; authentication), Resend
          (email delivery), and Google (business data). These providers process
          data on our behalf and are bound to protect it.
        </p>

        <h2>Retention</h2>
        <p>
          We keep personal information only as long as needed for the purposes
          above, or as required by law. You may ask us to delete your account or
          enquiry data at any time.
        </p>

        <h2>Your rights</h2>
        <p>
          Under PIPEDA you may request access to, correction of, or deletion of
          your personal information. If a profile about your company is listed
          and you&rsquo;d like it corrected or removed, contact us.
        </p>

        <h2>Contact</h2>
        <p>
          Questions or requests:{" "}
          <a
            href="mailto:privacy@appdevelopmenttoronto.com"
            className="font-medium text-blue-600 hover:underline"
          >
            privacy@appdevelopmenttoronto.com
          </a>
          .
        </p>
      </div>
    </Container>
  );
}
