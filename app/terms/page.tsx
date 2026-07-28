import { LegalPage, LegalSection } from "@/components/legal/legal-page"

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="July 2026">
      <LegalSection title="Acceptance of Terms">
        <p>
          By creating an account or using Schematic.ai, you agree to these
          Terms of Service. If you do not agree, do not use the service.
        </p>
        <p>
          These terms apply to all users, including free trial users and
          paid subscribers.
        </p>
      </LegalSection>

      <LegalSection title="Using Schematic.ai">
        <p>
          Schematic.ai is an AI-powered data analysis tool. You upload
          datasets (CSV or Excel) and ask questions in plain English. The
          system generates SQL queries, executes them against your data, and
          returns results.
        </p>
        <p>
          You may use Schematic.ai only for lawful purposes and in accordance
          with these terms. You must not use the service to store, process,
          or transmit illegal or harmful content.
        </p>
      </LegalSection>

      <LegalSection title="User Responsibilities">
        <p>
          You are responsible for the data you upload and the questions you
          ask. You must ensure you have the legal right to upload and process
          any data you submit to Schematic.ai.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials. You must notify us immediately of any
          unauthorized access to your account.
        </p>
        <p>
          You must not attempt to circumvent rate limits, access other
          users&apos; data, or use the service in a way that degrades
          performance for other users.
        </p>
      </LegalSection>

      <LegalSection title="Uploaded Content">
        <p>
          You retain full ownership of all data and files you upload to
          Schematic.ai. We do not claim any intellectual property rights over
          your data.
        </p>
        <p>
          By uploading data, you grant us the limited right to process,
          store, and transmit that data solely for the purpose of providing
          the service to you (e.g., generating SQL queries, displaying
          results).
        </p>
        <p>
          You represent and warrant that your uploaded data does not violate
          any applicable law or third-party rights.
        </p>
      </LegalSection>

      <LegalSection title="AI-Generated Responses">
        <p>
          Schematic.ai uses large language models to generate SQL queries
          based on your questions and table schemas. While we strive for
          accuracy, AI-generated responses may contain mistakes,
          hallucinations, or produce incorrect SQL.
        </p>
        <p>
          <strong>
            Always verify important business decisions independently.
          </strong>
          Schematic.ai is a productivity tool, not a substitute for
          professional financial analysis, accounting, or legal advice.
        </p>
        <p>
          We recommend reviewing generated SQL before relying on results,
          especially for critical business decisions.
        </p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>
          We aim to provide reliable access to Schematic.ai, but we do not
          guarantee uninterrupted or error-free operation. The service is
          provided &quot;as is&quot; and &quot;as available&quot; without
          warranties of any kind, either express or implied.
        </p>
        <p>
          We may perform maintenance, updates, or introduce changes that
          temporarily affect availability. We will make reasonable efforts to
          minimize disruption.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual Property">
        <p>
          Schematic.ai, the Schematic.ai logo, and the application
          interface are the property of Schematic.ai. You may not copy,
          modify, distribute, or reverse-engineer the service without
          explicit permission.
        </p>
        <p>
          The generated SQL queries and analysis results produced while
          using the service are yours to use as you see fit, subject to the
          limitations in these terms.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You may stop using Schematic.ai at any time and delete your
          account through the application interface.
        </p>
        <p>
          We may suspend or terminate accounts that violate these terms,
          abuse the service, or engage in conduct that could harm other
          users or the platform. We will provide notice where reasonable.
        </p>
        <p>
          Upon termination, your access to uploaded data and chat history
          will be removed. You should export any data you wish to keep
          before termination.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of Liability">
        <p>
          Schematic.ai is provided &quot;as is&quot; without warranty of any
          kind. To the maximum extent permitted by law, we disclaim all
          warranties, whether express, implied, or statutory, including
          merchantability, fitness for a particular purpose, and
          non-infringement.
        </p>
        <p>
          In no event shall Schematic.ai be liable for any indirect,
          incidental, special, or consequential damages arising from your
          use of the service, including reliance on AI-generated results.
        </p>
      </LegalSection>

      <LegalSection title="Changes to the Terms">
        <p>
          We may update these Terms of Service from time to time. Material
          changes will be communicated via email or through the application.
          Continued use of Schematic.ai after changes take effect
          constitutes acceptance of the updated terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms? Reach out to us at{" "}
          <a
            href="mailto:support@schematic.ai"
            className="text-primary hover:underline"
          >
            support@schematic.ai
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
