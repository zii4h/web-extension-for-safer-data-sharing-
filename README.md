# JITO 0.4.5 - Privacy, Before You Upload.

JITO now uses a **generic, per-site upload adapter**, rather than a ChatGPT-only integration. Enable it on an HTTP/HTTPS website, then supported standard file-picker clicks open a private review popup. Approving a review hands the cleaned copy to that website's actual upload input. No submit/send button is pressed.

**Compatibility release:** real extension code, tested in Chrome against controlled upload pages on two independent origins. No production SaaS backend is certified yet. This is not a promise of universal protection.

## Install or update

1. Extract `JITO-extension-v0.4.5.zip`.
2. Open `chrome://extensions` (or `edge://extensions`), enable **Developer mode**, and click **Load unpacked**.
3. Select the `jito` folder containing `manifest.json`. If updating files in the same previously installed folder, use **Reload** instead. Avoid leaving the older version installed from a different directory.
4. Confirm version **0.4.5**. Open the SaaS website you want to use.
5. Click JITO in the browser's Extensions menu, then **Enable JITO on this site**. Grant the browser's requested access for that site.
6. Refresh the website once. A floating **JITO · Review & attach** button confirms the content script is present. Presence is not a guarantee that every upload method on that site is covered.

No server, build step, API key, npm dependency, or cloud analysis is required to use the extension. Chrome was exercised; Edge compatibility is intended but not verified.

## Real upload workflow

1. Click the website's normal upload button. If it activates a connected standard `<input type="file">` through a click event, JITO stops that picker before selection and opens its review popup.
2. The popup shows the destination website. Choose **one supported file inside JITO**.
3. Review actual findings and the sharing-copy preview. Choose which text findings to redact. Image metadata is removed together.
4. Tick the review confirmation, then **Attach cleaned copy to website**. This is the disclosure step; the site can upload the approved copy immediately.
5. JITO reports that it handed the cleaned file to the site's upload control. Close the panel and confirm the website's attachment preview appears and finishes processing.
6. Submit your form or send your message yourself.

The site's original picker never receives your source file in this flow. The source is selected inside a cross-origin extension frame. Only approved output bytes are relayed through extension runtime ports, then placed in the destination input as a new `File`.

**A handoff notice is not proof of server upload completion.** Websites can reject synthetic events, file types, account quotas, or file sizes. Check the site's own attachment state. JITO does not automatically retry because that could create duplicates.

## If the normal upload button does not open JITO

Do not select a private original in a website-owned picker while expecting JITO to protect it. Cancel that picker. Use the floating **JITO · Review & attach** button instead. If the page exposes exactly one compatible file input, JITO can use it. If several exist, select the intended **Destination upload control** in the panel header, or click the website's relevant standard picker to bind that exact control.

If no compatible input exists, JITO stops instead of guessing. Use **Open standalone workspace** from the extension popup to download a cleaned copy and upload that copy manually.

## Coverage boundaries

| Path | Coverage |
| --- | --- |
| Standard connected file-input click on an enabled top-level site | Review popup before selection |
| Script calling `.click()` on a connected file input | Same click checkpoint |
| Floating JITO button → compatible page input | Explicit review and handoff |
| Multiple upload inputs | Exact clicked input, or explicit destination selection |
| Drop directly onto the enabled SaaS page | JITO stops the drop before the page receives it, then asks you to choose the file inside JITO |
| Paste directly onto the SaaS page | **Not covered** |
| `showOpenFilePicker()`, direct `showPicker()`, detached inputs, custom native pickers | **Not covered automatically** |
| Uploaders inside embedded iframes | **Not covered** |
| Closed shadow DOM / inaccessible custom components | May not expose a compatible input |
| Browser internal pages, extension stores, standalone desktop apps | Not supported |
| Other sites not enabled in the popup | Unchanged / not protected |

The event interceptor is not a network firewall or a defense against a malicious host page. It does not intercept files the site already obtained. A late-loaded extension cannot guarantee priority over all earlier website listeners; refresh after enabling for earliest registration. Every new site needs an acceptance check for its actual upload path.

Folder selection and camera-capture inputs encountered by the click checkpoint are stopped with a notice because this release cannot sanitize them.

## Supported files

| Input | What happens | Output |
| --- | --- | --- |
| JPEG, static PNG | Inspect metadata blocks, render pixels, re-encode and inspect result | Fresh PNG |
| UTF-8 TXT, MD, CSV, LOG | Find likely emails, US SSNs, Luhn-valid card numbers, selected secret-token prefixes; redact selected occurrences | Plain TXT |

Limits: images 15 MB, 20 megapixels, 10,000 px per side; text 2 MB and 1,000 findings. Large/complex/malformed images and animated PNG are refused. Generated PNG above 15 MB is refused.

PDF, DOCX, other Office formats, HEIC, OCR, visible-image masking, and contextual AI are not implemented. Detection has false positives and false negatives. No findings does not mean safe. An image keeps visible names/faces/text and may retain steganographic content in its pixels. Metadata tags cannot be selected individually. Browser rendering can change colors and file size; orientation is baked into pixels. Standard encoder-generated technical metadata can remain.

Output extensions change: a JPEG becomes PNG and a CSV becomes TXT. JITO honors the site's `accept` constraint for the **output**. A JPEG-only input cannot receive its PNG result; use another compatible destination. CSV is not exported as a validated spreadsheet.

## Privacy and permissions

- `activeTab`: identifies the current site when you open the popup.
- `scripting`: registers the upload adapter on sites you enable.
- Optional HTTP/HTTPS site access: requested per site, not silently granted to all websites. Chrome may display read/change-site-data wording because the adapter operates in that site's page.
- Access persists on enabled sites until disabled. **Disable on this site** removes registration, removes the live adapter from matching tabs, and revokes the requested origin access.
- No storage permission, telemetry, remote fonts, third-party scripts, or cloud analysis.
- Source files remain in extension-frame memory. Closing/clearing drops application references; this is not secure memory erasure. Downloads remain on disk.
- Approved cleaned bytes are intentionally disclosed to the chosen site. Sensitive text you keep and visible image content remain in those bytes.
- The original disk file is never edited. Integrated output uses the neutral filename `jito-sharing-copy`.

## First real-site acceptance check

Use the supplied `acceptance-sample.txt` on a site accepting TXT. It contains fictional test identifiers. Enable JITO, refresh, click that site's upload button, and confirm the JITO popup appears **before any source file selection**. Choose the sample in JITO, confirm redactions, approve, and verify the neutral-name attachment appears on the website. Canceling JITO should leave no new attachment.

For image-only sites, use a non-sensitive JPEG/PNG you own. Do not use private files to discover whether a new upload path is covered. If no popup appears, use the floating button or manual cleaned-copy workflow.

## Implementation and tests

- `manifest.json`: Manifest V3 and optional site permissions.
- `popup.js`: enable/disable current site; persistent content-script registration.
- `site.js`: generic before-picker click checkpoint, floating launcher, modal, target selection, accepted-file-type check, cleaned `File` handoff.
- `background.js`: validates origin permission, tab-bound random session, extension-frame sender, and one-shot output relay. No `window.postMessage` file bridge.
- `integration.js`: converts the reviewed output Blob to private runtime transport; shows the destination and handoff result.
- `core.js`: bounded image parsing and text pattern detection.
- `workspace.js`: file loading, findings, explicit selection, preview, image rendering, output verification, standalone export.

Run engine tests with Node 20+:

```powershell
node --test tests/core.test.cjs
```

Optional integration test requires Playwright in your development environment:

```powershell
node tests/integration.test.cjs
```

Environment overrides: `JITO_PLAYWRIGHT` (package path), `JITO_CHROME` (Chrome executable), `JITO_TEST_DIR` (temporary test-artifact directory). The test uses a temporary extension copy with grants limited to two fake `.test` origins, and locally fulfills all requests. It tests the actual adapter and redacted outgoing bytes, **not a live SaaS backend or the browser permission prompt**. The test fixture is not shipped as a user-facing simulator.

See [VALIDATION.md](VALIDATION.md) for exact verification and remaining gaps.

## Next stages

Certify real SaaS upload paths with this generic adapter; add site-specific adapters only where necessary. Add drag/drop, paste, iframe, and filesystem-picker handling as separately tested features. Add format-aware PDF/Office sanitization independently. Do not label every upload protected until its actual path is verified.

References: [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts), [Chrome runtime messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging), [load unpacked extensions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world), [PNG format](https://www.w3.org/TR/png-3/).


