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
          <h2>1. Information We Collect</h2>

          <p>
            BStore collects information needed to
            operate its wholesale ordering service,
            including your name, phone number,
            delivery address, optional email address,
            and order information.
          </p>

          <p>
            The app may also process device push
            notification tokens when notifications
            are enabled.
          </p>
        </section>

        <section className="legal-card">
          <h2>2. How We Use Information</h2>

          <p>
            We use this information to manage customer
            accounts, verify phone numbers, process
            orders, provide customer support, and
            deliver order-related notifications.
          </p>
        </section>

        <section className="legal-card">
          <h2>3. Data Security</h2>

          <p>
            We use technical and organizational
            measures intended to protect customer
            information against unauthorized access
            and misuse.
          </p>
        </section>

        <section className="legal-card">
          <h2>4. Account Deletion</h2>

          <p>
            You can request deletion of your account
            through the BStore app or through our
            public account deletion page.
          </p>

          <p>
            Active orders must be resolved before
            account deletion can be completed.
          </p>

          <p>
            When deletion is completed, we remove
            the customer account, cart, favorites,
            login sessions, and account-linked push
            notification records.
          </p>

          <p>
            Historical orders and invoices may be
            retained for legitimate business or
            applicable legal purposes. Invoices may
            include customer information recorded
            when the sale occurred.
          </p>

          <p>
            Our detailed retention schedule is
            being finalized. Contact us for
            information about retained records.
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
          <h2>5. Your Privacy Requests</h2>

          <p>
            You can contact BStore to request access
            to, correction of, or deletion of your
            personal information, subject to
            applicable requirements.
          </p>
        </section>

        <section className="legal-card">
          <h2>6. Contact Us</h2>

          <p>
            For privacy questions or account deletion
            requests, contact:
          </p>

          <a
            className="legal-link"
            href={`mailto:${EMAIL}`}
          >
            {EMAIL}
          </a>
        </section>

        <footer className="legal-footer">
          BStore — Privacy Policy
        </footer>
      </div>
    </main>
  );
}