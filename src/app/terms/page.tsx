import { Container } from "@/components/container";

export const metadata = {
  title: "Terms of Service",
  description: "The terms governing use of Toronto App Developers.",
};

export default function TermsPage() {
  return (
    <Container className="max-w-3xl py-14">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: August 2026</p>

      <div className="mt-8 space-y-6 text-slate-600 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1">
        <p>
          By using appdevelopmenttoronto.com (the &ldquo;Service&rdquo;) you
          agree to these terms. If you don&rsquo;t agree, please don&rsquo;t use
          the Service.
        </p>

        <h2>The directory</h2>
        <p>
          We list app development companies in the Greater Toronto Area using
          publicly available information. Rankings are computed from objective
          signals and are provided for informational purposes only; we make no
          guarantee about any company&rsquo;s suitability. Do your own due
          diligence before engaging a provider.
        </p>

        <h2>Claiming a profile</h2>
        <p>
          You may claim a company profile only if you are authorized to
          represent that company. You are responsible for the accuracy of the
          information you add, and you grant us permission to display it. We may
          remove content that is inaccurate, unlawful, or abusive.
        </p>

        <h2>Paid features</h2>
        <p>
          Featured placement and verified badges are optional paid features
          arranged directly with our team, with payment handled offline.
          Featured listings are always labeled as sponsored and do not alter the
          organic rankings. Fees, duration, and terms are agreed at the time of
          purchase.
        </p>

        <h2>Acceptable use</h2>
        <ul>
          <li>Don&rsquo;t scrape, copy, or resell the directory in bulk.</li>
          <li>Don&rsquo;t submit false information or impersonate a company.</li>
          <li>Don&rsquo;t attempt to disrupt or abuse the Service.</li>
        </ul>

        <h2>Disclaimer &amp; liability</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any
          kind. To the fullest extent permitted by law, we are not liable for
          any damages arising from your use of the Service or from any
          engagement you enter into with a listed company.
        </p>

        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of the Province of Ontario and
          the federal laws of Canada applicable therein.
        </p>

        <h2>Contact</h2>
        <p>
          Questions:{" "}
          <a
            href="mailto:hello@appdevelopmenttoronto.com"
            className="font-medium text-blue-600 hover:underline"
          >
            hello@appdevelopmenttoronto.com
          </a>
          .
        </p>
      </div>
    </Container>
  );
}
