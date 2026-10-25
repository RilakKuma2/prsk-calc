# Shared login module

`sekai-statics/src/login` and `prsk-calc/src/login` must remain byte-for-byte identical.
Copy the whole folder in either direction; its only package dependencies are React
and React DOM (compatible with the projects’ React 18 and 19 installations).

`index.tsx` owns authentication, profile UI, storage API access, account-state sync
and conflict handling. `login.css` includes modal and close-button styling.
`safeStorage.js` handles unavailable/corrupt browser storage; `useModalAccessibility.js`
owns modal focus, Escape, and scroll locking. Calculator utility/hook paths re-export
these implementations so there is only one implementation per project.

Supply API URLs, cache keys, namespaces and local-state adapters through the existing
provider/hook options outside this folder. Host apps provide their theme variables
and `/legal_ko.html`, `/legal_en.html`, `/legal_ja.html` public pages.
Do not import app-specific components, hooks or utilities from outside this folder.

After changes, compare both folders with `diff -ru`, build both apps and run the
calculator login/storage/modal tests. Preserve changes from both copies before
replacing either folder. Local admin, forks and archived sites are not sync targets.

From `sekai-statics`, run `node --test tests/sharedLoginPortability.test.js` to
check internal dependencies and, when the sibling checkout exists, file equality.

## Google sign-in

`LoginProvider` accepts the optional public `googleClientId` prop. An empty value
hides Google sign-in and does not load the Google script. The shared module never
reads Vite/CRA environment variables directly. Both apps use the same web client:

| Location | Setting |
| --- | --- |
| `sekai-statics/.env` | `VITE_GOOGLE_CLIENT_ID=` |
| `prsk-calc/.env` | `REACT_APP_GOOGLE_CLIENT_ID=` |
| Worker local `sekai-statics/.dev.vars` | `GOOGLE_CLIENT_ID=` |
| Deployed `sekai-statics` Worker environment | `GOOGLE_CLIENT_ID` |

Create a **Web application** OAuth client in Google Auth Platform. Register
`https://rilakbest.com` and `https://rilaksekai.com` as authorized JavaScript origins;
for local testing add `http://localhost`, `http://localhost:5238` and
`http://localhost:3000`. Configure the consent screen, authorized domains and
privacy-policy URL. For HTTP localhost the shared Google button sets the
referrer policy recommended by Google (`no-referrer-when-downgrade`); HTTPS
production pages keep their existing policy. Basic Google sign-in scopes have an exception to Google's testing-user limits; review the Audience and Branding settings before launch.
This uses the GIS popup/JavaScript credential callback: no redirect URI, client
secret, Google API access token or refresh token is needed. If a host adds CSP or
COOP headers, allow the GIS resources/popups per Google's setup guide.

Before enabling the frontend IDs, apply `migrations/0009_google_login.sql` and
`migrations/0010_google_account_setup.sql` to the
existing auth D1 database, then apply `0011_google_data_minimization.sql` and deploy the Worker with `GOOGLE_CLIENT_ID` set to the
same ID (for example, `npx wrangler secret put GOOGLE_CLIENT_ID`). Local `.env` and
`.dev.vars` files do **not** configure the deployed Worker's environment. Then
rebuild/deploy both frontends. Production D1 migration and deployment are separate
operations; building the apps does not apply them.

First Google sign-in immediately creates an active passwordless account with a
random `user_…` username. The button displays the Terms/Privacy notice before the
request; the server requires consent and records its version/time. The generated
username can be changed exactly once (an atomic conditional update); failed
validation or a duplicate username does not consume that allowance. The profile
shows two primary actions for new Google accounts: set a username/password or
link an existing account. Each opens a separate accessible dialog; closing it
returns to the profile and clears its password fields.

Google-authenticated sessions may set their initial password, or connect to an
existing account **before** setting one. Existing-account connection requires the
target's password and explicit confirmation. It keeps the target's ID, username,
data and permissions, moves the Google identity atomically, and revokes source
sessions. The original Google account is disabled with a `merged_into` reference;
its states remain intact and can be downloaded by the target via the profile's
backup button. Archived accounts cannot use outstanding storage JWTs. Email
matches never automatically merge accounts or confer access.

Google's official sign-in flow can deliver name/email/picture claims in the
transient ID token and still displays Google's profile-sharing consent. Only the
SHA-256 hash of the Google subject (domain-separated by `google-sub:v1:`) is
persisted in `google_sub`; this is a stable pseudonymous identifier, not anonymous
data. Name, Google email and picture are not stored or copied to recovery email.
The optional recovery email is a separate user-controlled field. `google_email`
is retained as a nullable legacy column and cleared by migration 0011. That
migration also clears unambiguously auto-filled emails on passwordless Google
accounts, while preserving recovery addresses on password accounts.

After deploying the Worker, run `node scripts/hash-google-identifiers.mjs --remote`
to report only the count of legacy raw IDs, then add `--apply` to hash them in
place. It preserves user IDs and stored data, uses a private temporary SQL file,
and does not log the identifiers. The Worker also supports and converts legacy
raw IDs on a verified login, so links remain valid during migration.

On that browser, a per-account restore marker makes each namespace load the
target's remote value once, including empty/missing states, before automatic
saving resumes. Registered adapters are backed up before switching accounts;
later-mounted adapters are backed up before restore. Unsynced local snapshots
stay in that browser and are included as `localStates` in the backup download.
They are not uploaded to the target. If a local backup cannot be persisted, the
restore stops instead of discarding local data. Host code that restores states
outside `useAccountState` must use `needsLinkedAccountRestore` and
`restoreLinkedAccountState` from `useUserStateApi` before its usual merge logic.

For existing password accounts, the Link Google button (with the official local
`google-logo.png` asset from [Google branding](https://developers.google.com/identity/branding-guidelines)) first reveals password
verification. Successful verification is stored on that exact server session,
not in a browser password cache. The Google button then works until logout or
session expiry, including modal reopen and refresh. A different session must
verify again. Unlinking still requires a working password. The existing recovery
flow remains available. Host `/legal_*.html` pages explain these flows, backup
retention, cookies and the use of Google/Cloudflare.

The Worker verifies Google's RS256 signature, issuer, audience, expiry, authorized
party and nonce using `jose`. A short-lived, single-use D1 challenge is bound to an
HttpOnly cookie, allowed frontend origin, action and (for account changes) session.
It reuses the existing session cookies, rate limits, account status and invite-code
rules. Google credentials remain in modal memory only, never local storage or URLs.

References: [Google setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid),
[ID token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
