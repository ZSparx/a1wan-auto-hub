# Plan: Publish the app

## Goal
Publish the current app to its live Lovable URL so the client can review it.

## Steps
1. Check the latest security scan results for any unresolved critical findings.
2. Verify the project's publish visibility (public vs private).
3. Trigger `preview_ui--publish` to deploy the app to the live URL.
4. Confirm the expected live URL and any next steps (custom domain, badge visibility).

## Notes
- The database does **not** move or change during publishing. The published app will connect to the same Lovable Cloud backend used by the preview.
- The user has already confirmed they want to publish now.