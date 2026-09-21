import React from "react";
import "./PublicLegal.css";

const EMAIL = "b.storelb@gmail.com";

export default function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <h1>BStore — Privacy Policy</h1>
          <p>Last updated: September 21, 2026</p>
        </header>

        <section className="legal-card">
          <h2>1. Introduction</h2>

          <p>
            BStore is a wholesale ordering application.
            This Privacy Policy explains how we collect,
            use, disclose, retain, and protect personal
            information when you use our application
            and related services.
          </p>

          <p>
            By using BStore, you acknowledge the
            information described in this policy.
          </p>
        </section>

        <section className="legal-card">
          <h2>2. Information We Collect</h2>

          <p>
            We collect information necessary to provide
            our wholesale ordering services, including:
          </p>

          <ul>
            <li>
              Account information, such as your first
              name, last name, phone number, delivery
              address, and optional email address.
            </li>

            <li>
              Authentication information used to
              register, sign in, verify your phone
              number, and recover access to your
              account.
            </li>

            <li>
              Order and transaction information,
              including purchased products, quantities,
              prices, order status, delivery details,
              and invoice records.
            </li>

            <li>
              Shopping cart and favorite product
              information.
            </li>

            <li>
              Device notification tokens and
              notification preferences when you
              enable push notifications.
            </li>

            <li>
              Information you provide when contacting
              us for customer support or privacy
              requests.
            </li>
          </ul>

          <p>
            Passwords are used for account
            authentication. We do not need your
            password when you contact customer
            support, and you should never send it
            to us by email.
          </p>
        </section>

        <section className="legal-card">
          <h2>3. How We Use Your Information</h2>

          <p>
            We use personal information to:
          </p>

          <ul>
            <li>
              Create and manage customer accounts.
            </li>

            <li>
              Authenticate users, verify phone
              numbers, and support password recovery.
            </li>

            <li>
              Process, prepare, and manage orders.
            </li>

            <li>
              Maintain invoices and transaction
              records.
            </li>

            <li>
              Provide customer support and respond
              to requests.
            </li>

            <li>
              Send order-related notifications.
            </li>

            <li>
              Send offer notifications when enabled
              in your notification preferences.
            </li>

            <li>
              Maintain the security and proper
              operation of our services.
            </li>

            <li>
              Comply with applicable legal and
              accounting requirements.
            </li>
          </ul>
        </section>

        <section className="legal-card">
          <h2>4. Service Providers and Data Sharing</h2>

          <p>
            BStore uses external technology services
            to operate its application and backend
            infrastructure. Depending on the service
            involved, these providers may process
            information necessary for hosting,
            database storage, image storage,
            notifications, or operational email.
          </p>

          <p>
            Information is shared with service
            providers only to the extent needed
            for the relevant service or another
            applicable purpose described in this
            policy.
          </p>

          <p>
            We may also disclose information when
            required by applicable law or when
            necessary to protect the security and
            integrity of our services.
          </p>
        </section>

        <section className="legal-card">
          <h2>5. Push Notifications</h2>

          <p>
            If you enable notifications, BStore may
            register a device notification token
            to deliver order updates and offers.
          </p>

          <p>
            You can change notification preferences
            in the application or disable
            notifications through your device
            settings.
          </p>
        </section>

        <section className="legal-card">
          <h2>6. Data Security</h2>

          <p>
            We use technical and organizational
            measures intended to protect personal
            information against unauthorized access,
            loss, misuse, and alteration.
          </p>

          <p>
            No method of electronic storage or
            transmission is completely secure.
            We cannot guarantee absolute security.
          </p>
        </section>

        <section className="legal-card">
          <h2>7. Data Retention</h2>

          <p>
            We retain personal information for as
            long as necessary to provide our
            services and meet applicable legal,
            accounting, and legitimate business
            requirements.
          </p>

          <p>
            Historical orders and invoices may
            remain after account deletion when
            retention is necessary for these
            purposes. Invoices may contain customer
            information recorded at the time of
            the transaction.
          </p>

          <p>
            When retention is no longer necessary,
            we delete or anonymize personal
            information, where appropriate.
          </p>

          <p>
            You may contact us for information
            about retained records associated
            with your account.
          </p>
        </section>

        <section className="legal-card">
          <h2>8. Account Deletion</h2>

          <p>
            You can request deletion of your
            account through the BStore application
            or our public account deletion page.
          </p>

          <p>
            Active orders must be resolved before
            account deletion can be completed.
          </p>

          <p>
            When account deletion is completed,
            we remove the customer account,
            shopping cart, favorites, login
            sessions, and account-linked push
            notification records.
          </p>

          <p>
            Historical orders and invoices may
            be retained for applicable legal,
            accounting, and legitimate business
            purposes, as described in Section 7.
          </p>

          <p>
            Retained invoices may continue to
            contain customer details recorded
            when the sale occurred.
          </p>

          <p>
            <a
              className="legal-link"
              href="/delete-account"
            >
              Request Account Deletion
            </a>
          </p>
        </section>

        <section className="legal-card">
          <h2>9. Your Privacy Requests</h2>

          <p>
            You may contact BStore to request
            access to, correction of, or deletion
            of your personal information, subject
            to applicable requirements.
          </p>

          <p>
            We may need to verify your identity
            before processing certain requests.
          </p>

          <p>
            Some information may need to be
            retained where applicable legal,
            accounting, or legitimate business
            requirements apply.
          </p>
        </section>

        <section className="legal-card">
          <h2>10. Changes to This Policy</h2>

          <p>
            We may update this Privacy Policy
            when our services or data practices
            change or when necessary to address
            applicable requirements.
          </p>

          <p>
            The latest version will be published
            on this page with an updated date.
          </p>
        </section>

        <section className="legal-card">
          <h2>11. Contact Us</h2>

          <p>
            For privacy questions, information
            requests, or account deletion
            assistance, contact BStore at:
          </p>

          <p>
            <a
              className="legal-link"
              href={`mailto:${EMAIL}`}
            >
              {EMAIL}
            </a>
          </p>
        </section>

        <footer className="legal-footer">
          BStore — Privacy Policy
        </footer>
      </div>
    </main>
  );
}