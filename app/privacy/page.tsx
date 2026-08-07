import { LegalPage, LegalSection } from "@/components/legal/legal-page"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Schematic AI",
  description:
    "Learn how Schematic AI collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="July 2026">
      <LegalSection title="Information We Collect">
        <p>
          When you create an account, we collect your email address and a
          password (stored securely via Supabase Auth).
        </p>
        <p>
          When you use Schematic AI, we collect the datasets you upload (CSV or
          Excel files), the questions you ask, and the responses generated. This
          information is stored per your account and is not shared with other
          users.
        </p>
        <p>
          We collect the datasets you upload (such as CSV or Excel files), the questions you ask, and the responses generated. 
          Your uploaded data is processed to prepare metadata, table schemas, and other contextual information required to answer your questions. 
          Your datasets remain private to your account and are not shared with other users.
        </p>
      </LegalSection>

      <LegalSection title="How We Use Your Information">
        <p>
          Your email and account information are used to authenticate you, send
          essential service communications (e.g., password resets), and manage
          your subscription if applicable.
        </p>
        <p>
          Your uploaded datasets and questions are processed solely to generate
          the SQL queries and answers you request. We use your uploaded data solely to provide and improve the functionality of Schematic AI and as otherwise described in this Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection title="Data Storage">
        <p>
          Your account information is stored in Supabase, our authentication and
          database provider. Uploaded files are stored in Supabase Storage.
          Chat history and generated SQL are stored in Supabase PostgreSQL
          tables, scoped to your account.
        </p>
        <p>
          You can delete your datasets and chat history at any time through the
          application interface. Account deletion will remove all associated data
          from our systems.
        </p>
      </LegalSection>

      <LegalSection title="AI Processing">
        <p>
          When you ask a question, Schematic AI sends your question and the
          schema of your uploaded tables to Groq (our LLM provider) to generate
          a SQL query. The SQL is then executed locally in your browser via
          DuckDB (WebAssembly). The returned rows for your current query (up to 50) may be sent to Groq solely to produce a plain-English explanation of that answer.
        </p>
        <p>
          <strong>
            Your uploaded data is never used to train or fine-tune AI models.
          </strong>
          Only the table schema (column names and types) is sent alongside your question to generate the SQL query. Full dataset contents are not sent for SQL generation; however, the returned rows of your current query (up to 50) may be sent to a third-party LLM to help explain your results.
        </p>
      </LegalSection>

      <LegalSection title="Data Security">
        <p>
          We use industry-standard encryption in transit (TLS) and at rest.
          Authentication is handled by Supabase Auth, which follows security
          best practices including password hashing and rate limiting.
        </p>
        <p>
          Access to your data is restricted to your account. Infrastructure access
          is limited to the minimum necessary for operation and incident response.
        </p>
      </LegalSection>

      <LegalSection title="Cookies &amp; Authentication">
        <p>
          Schematic AI uses cookies and local storage tokens necessary for
          authentication and session management. These are required for the
          service to function and are not used for tracking or advertising.
        </p>
        <p>
          We do not use third-party analytics cookies, marketing cookies, or
          any form of cross-site tracking.
        </p>
      </LegalSection>

      <LegalSection title="Third-Party Services">
        <p>Schematic AI relies on the following third-party services:</p>

        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Supabase</strong> — authentication, database, and file
            storage
          </li>
          <li>
            <strong>Groq</strong> — LLM inference (sent: your question, table schemas, generated SQL, and up to 50 returned rows from your current query)
          </li>
          <li>
            <strong>Vercel</strong> — application hosting and deployment
          </li>
        </ul>

        <p>
          Each service processes data in accordance with its own privacy
          and security policies. We have selected providers that offer
          adequate data protection guarantees.
        </p>
      </LegalSection>

      <LegalSection title="Your Rights">
        <p>
          You own the data you upload to Schematic AI. You may export,
          modify, or delete your datasets and chat history at any time.
        </p>
        <p>
          You may request a copy of all data associated with your account by
          emailing getschematicai@gmail.com. We will make reasonable efforts to respond to such requests in accordance with applicable law
        </p>
        <p>
          You may delete your account at any time. Upon deletion, We will make reasonable efforts to remove associated data from our active systems.
        </p>
      </LegalSection>

      <LegalSection title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Material
          changes will be communicated via email or through the application.
          Continued use of Schematic AI after changes take effect constitutes
          acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Have questions about this policy or your data? Reach out to us at{" "}
          <a
            href="mailto:getschematicai@gmail.com"
            className="text-primary hover:underline"
          >
            getschematicai@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
