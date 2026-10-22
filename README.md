# LoanMitra India

Next.js landing page for salaried loan enquiries in India. The form sends details to **Gmail SMTP** and **Google Sheets through Apps Script**, then opens a prefilled **WhatsApp** chat. The visitor reviews the message and taps **Send** in WhatsApp. Opening the chat does not deliver a WhatsApp message.

## Run locally

Use Node.js 24 (matching the development and test environment).

```powershell
npm install
# Only when .env.local does not already exist:
Copy-Item .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Fill `.env.local` as described below, then restart the server. All credentials are server-only: never add `NEXT_PUBLIC_`, commit them, or paste them into chat.

```powershell
npm test
npm run typecheck
npm run build
npm start
```

## 1. Gmail with an app password

1. Enable **2-Step Verification** on the sending Google account.
2. Generate an app password using [Google's app-password settings](https://myaccount.google.com/apppasswords). Account or organization policies can make this option unavailable; see [Google's guidance](https://support.google.com/accounts/answer/185833).
3. Set these values in `.env.local`:

```dotenv
GMAIL_USER=your-sending-account@gmail.com
GMAIL_APP_PASSWORD="your 16 character app password"
LEAD_EMAIL_TO=client@example.com
```

The password value must be the actual 16-character app password, not the example or your regular Google password. Spaces between its groups are removed automatically. Multiple recipients can be separated by commas.

Email uses `smtp.gmail.com:465` with TLS, and `GMAIL_USER` is also the From address. Outbound SMTP must be supported by the deployment host. Gmail sending limits and account security checks apply. SMTP acceptance does not guarantee inbox placement. No Google Cloud billing setup or Resend account is required for this implementation. A future provider can replace `sendEmail` without changing the form.

## 2. Google Sheets through Apps Script

1. Create a **private** spreadsheet owned by the client's Google account. Create an empty tab named `Leads`.
2. Select **Extensions → Apps Script**. Replace the default code with the contents of [apps-script/Code.gs](apps-script/Code.gs) and save.
3. Open **Project Settings → Script properties**, and add:

| Property | Value |
|---|---|
| `SPREADSHEET_ID` | The part between `/d/` and `/edit` in the spreadsheet URL |
| `SHEET_NAME` | `Leads` |
| `WEBHOOK_SECRET` | A random secret of at least 32 characters |

Generate a secret locally if needed; copy it directly into Script Properties and `.env.local`, not chat:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

4. Select **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Complete Google's authorization for your own script. The endpoint is reachable without a Google login, but its code rejects requests without the secret. The spreadsheet itself remains private. If your Workspace administrator prevents this access mode, it must be resolved before server-to-server requests will work.
5. Copy the production URL ending in `/exec` and set:

```dotenv
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GOOGLE_SHEETS_WEBHOOK_SECRET=the-same-secret-as-script-properties
```

Use the default Apps Script project and built-in `SpreadsheetApp`; no service account, advanced Sheets API or manual Cloud Console setup is needed. After changing script code, update the deployment to a **new version**. The `/dev` URL is only for editor testing and is not accepted by this app.

The receiver automatically adds these 13 headers to an empty tab:

```text
Reference | Submitted (UTC) | Name | Phone | Email | City | PIN code | Employer | Monthly salary | Requested loan | Salary bank | Contact consent | Consent version
```

An existing tab must match these headers. The script validates and authenticates requests, stores formula-like input as text, and locks the reference lookup plus row write. Repeated delivery of the **same reference** returns success without appending another row. Each new form submission generates a new reference; this is not cross-submission deduplication.

The server checks both `ok: true` and the matching reference in the webhook's JSON acknowledgement. It follows Google's content-result redirect with GET without forwarding the secret. HTML login pages, malformed replies and errors returned with HTTP 200 are failures.

## 3. WhatsApp click-to-chat

```dotenv
WHATSAPP_RECIPIENT=919876543210
```

Replace the example with the client's WhatsApp-enabled number: international digits only, no `+`, spaces or brackets. For India, use `91` followed by the 10-digit mobile number. This setting generates a public chat destination; unlike passwords, the number necessarily becomes visible to the visitor.

No Meta access token, template approval, sender ID or WhatsApp Business API is needed. When at least one backend destination acknowledges receipt, the confirmation view opens `https://wa.me/<recipient>?text=<encoded-enquiry>` in the same tab. The message includes the form details and reference, formatted with Indian currency grouping.

The success screen also has an **Open WhatsApp** link if app handoff is blocked. The visitor may need to sign in to WhatsApp Web or open the mobile app and must tap **Send**. This website cannot verify that step. Prefilled details are passed to WhatsApp in the link when opened; the privacy notice and consent explain this.

## Other settings and failure behaviour

- Set `SITE_URL` to the exact public origin without a trailing slash and `PRIVACY_CONTACT_EMAIL` to a monitored address. Keep `TRUST_PROXY=false` unless your trusted deployment proxy overwrites forwarded IP headers.
- Missing or invalid required configuration blocks all delivery with HTTP 503, before sending anything.
- Email and Sheets run independently. Both acknowledged = `delivered`; one acknowledged = `partially_delivered`. Either response includes a reference and WhatsApp link, and opens WhatsApp automatically. These statuses describe backend provider acceptance only.
- If neither channel acknowledges receipt, HTTP 502 preserves the form and offers a **manual** WhatsApp fallback. Network failures may be ambiguous: a provider could have accepted a request before its response was lost. No automatic resubmission is performed.
- Logs contain the reference and channel outcomes, not credentials, provider error bodies, applicant fields or prefilled URLs.
- No durable outbox or automatic retry worker is included. Operators must follow up partial failures using successful destinations and the reference. The per-process rate limiter is unchanged; it is not a shared production abuse-control service.
- Apps Script has [execution and usage quotas](https://developers.google.com/apps-script/guides/services/quotas). A script lock prevents overlapping writes but does not bypass those quotas.
- Existing populated environment values are preserved during migration. Old Resend, service-account and WhatsApp Cloud API settings are no longer read and can be removed after confirming the new setup.

## Validation

Automated tests mock SMTP, HTTP and Google Apps Script services; they never send a real email or WhatsApp message or append to a live sheet. Tests cover payload validation, SMTP configuration, independent failures, webhook acknowledgement and redirects, script authentication, duplicate references, lock contention, formula injection and React form navigation/fallback behaviour.

After configuring the real accounts, submit a clearly marked test enquiry, verify the email and sheet row share a reference, then review the WhatsApp message before sending it. Live delivery cannot be verified without the configured accounts.

The existing landing-page design and salary eligibility rule are preserved. See [DESIGN-RESEARCH.md](DESIGN-RESEARCH.md) for the visual direction. Confirm the client business identity, lending relationships, rates and final terms before publishing.
