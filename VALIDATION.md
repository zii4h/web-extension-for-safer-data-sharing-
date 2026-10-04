# JITO 0.4.5 validation - 4 October 2026

## Engine

13 Node regression tests pass. They cover real-content detection, selective redaction, Unicode, invalid identifiers, unsupported/binary input, size bounds, PNG CRC checks and metadata, animation rejection, image dimensions, JPEG metadata before/after scan data, truncation, and finding limits.

## Generic integration

The extension was loaded into isolated automated Chrome. The test runs the production scripts in a temporary copy whose manifest pre-grants only `upload-a.test` and `upload-b.test`; all requests on those origins are locally fulfilled. No fixture upload reaches a live service.

Checks cover disabled sites having no injection; enabled sites injecting the actual button; cross-origin frame isolation; zero page upload before approval; approved redacted bytes reaching the page and its intercepted HTTP upload sink; neutral filename; one-shot handoff; cancel; unsupported file; changed page; ambiguous input; SPA input replacement; image metadata removal; native picker clicks opening JITO before selection; exact clicked-input targeting among several fields; the same adapter on two independent origins; removal of live interception on disable; popup registration/injection and unregistration/removal; and no uncaught page errors.

## What remains unverified

- Real production SaaS acceptance, upload completion, and exact server bytes. The connected live browser cannot install this unpacked extension. No specific service is yet certified.
- The actual browser site-permission prompt and revocation of optional grants: the test grants its two fixture origins as required permissions in a temporary manifest. Production uses optional per-site permission requests. Disable is verified to unregister and remove the adapter; a retained browser grant is reported rather than falsely claimed revoked.
- Edge and Firefox; only Chrome was exercised. This is a Chrome/Edge MV3 package, not a Firefox-specific build.
- Direct page drag/drop, paste, filesystem-picker APIs, embedded upload frames, custom/native components, or adversarial page behavior.
- A broad camera-image corpus, performance at every limit, independent security audit, and store publication.

## Standalone output checks carried forward

The earlier workspace checks verified actual Chrome extension loading, the toolbar-to-workspace action, selective text preview, acknowledgment gating, generated redacted text bytes, session clearing, real PNG author-metadata detection, stripped PNG output and preserved test pixel color, real JPEG decode, PDF rejection, responsive layout, and absence of page errors.

The test environment's OS download manager canceled or crashed. Output bytes were inspected immediately before the standard Blob-URL download anchor instead. Final OS download completion remains unverified here; test the fictional sample in your regular browser before relying on the standalone save flow.

This is a compatibility candidate with real implementation and repeatable tests, not an audited universal upload firewall.


