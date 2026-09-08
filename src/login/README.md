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
