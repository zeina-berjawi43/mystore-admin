import React from "react";
import "./PublicLegal.css";

const EMAIL = "b.storelb@gmail.com";

const deletionEmail =
  `mailto:${EMAIL}?subject=${encodeURIComponent(
    "BStore Account Deletion Request"
  )}&body=${encodeURIComponent(
    "Hello BStore,\n\n" +
      "I would like to request deletion of my BStore account.\n\n" +
      "My registered phone number: \n\n" +
      "Please let me know how to verify account ownership.\n"
  )}`;

export default function DeleteAccount() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <header className="legal-header">
          <h1>BStore — Delete Your Account</h1>

          <p>
            Request deletion of your BStore account
            and associated personal data.
          </p>
        </header>

        <section className="legal-card">
          <h2>Delete your account in the app</h2>

          <ol>
            <li>Open BStore and sign in.</li>
            <li>Go to your Account page.</li>
            <li>Select Delete Account.</li>
            <li>Review and confirm the deletion.</li>
          </ol>

          <p>
            Accounts with active orders cannot be
            deleted until those orders are resolved.
          </p>
        </section>

        <section className="legal-card">
          <h2>Request deletion without the app</h2>

          <p>
            If you no longer have access to the app,
            you can request account deletion by email.
          </p>

          <p>
            Include your registered phone number
            so we can identify your account.
            We will verify account ownership
            before processing the request.
          </p>

          <p>
            Do not send passwords or verification
            codes by email.
          </p>

          <a
            className="legal-button"
            href={deletionEmail}
          >
            Request Account Deletion
          </a>

          <p className="legal-muted">
            Contact: {EMAIL}
          </p>
        </section>

        <section className="legal-card">
          <h2>What data is deleted?</h2>

          <p>
            When account deletion is completed,
            BStore deletes your customer account,
            shopping cart, favorites, login sessions,
            and account-linked push notification
            records.
          </p>

          <p>
            Historical orders are retained without
            their account link or shipping address.
          </p>
        </section>

        <section className="legal-card">
          <h2>What data may be retained?</h2>

          <p>
            Historical orders, invoices, and sales
            records may be retained for applicable
            legal, accounting, and legitimate
            business requirements.
          </p>

          <p>
            Historical invoices may contain customer
            information recorded at the time of sale.
            Deleting your account does not
            automatically remove this information
            from retained invoices.
          </p>

          <p>
            We retain these records for as long as
            necessary to meet the applicable
            requirements. When retention is no
            longer necessary, we delete or anonymize
            personal information, where appropriate.
          </p>

          <p>
            You may contact us for information
            about records retained after your
            account has been deleted.
          </p>
        </section>

        <section className="legal-card">
          <h2>Questions?</h2>

          <p>
            Email{" "}
            <a
              className="legal-link"
              href={`mailto:${EMAIL}`}
            >
              {EMAIL}
            </a>
          </p>

          <p>
            <a
              className="legal-link"
              href="/privacy-policy"
            >
              Read our Privacy Policy
            </a>
          </p>
        </section>

        <footer className="legal-footer">
          BStore — Account Deletion
        </footer>
      </div>
    </main>
  );
}