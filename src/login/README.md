# Shared login module

This folder is intentionally byte-for-byte identical to `prsk-calc/src/login`.
It owns authentication, account profile UI, storage API access, account-state
sync, conflict handling, and all related styles.

App-specific API URLs, cache keys, storage namespaces, and local-state adapters
must be supplied outside this folder. To update login behavior or UI, edit one
copy and replace the other project's whole `src/login` folder.
