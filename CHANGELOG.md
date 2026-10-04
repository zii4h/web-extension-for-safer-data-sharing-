# Changelog

JITO development history, reconstructed from the saved extension packages.

Entries appear newest first in the recorded build sequence. Intermediate headings retain the original package labels, including reused or out-of-order version numbers. The [source notes](docs/CHANGELOG-SOURCES.md) record the actual manifest versions and evidence for each entry. Release dates are omitted because publication dates were not independently established. No 0.2.x package was available to document.

## 0.4.5 - Version-label alignment

- Updated the manifest to 0.4.5.
- Updated the popup badge and workspace release label to 0.4.5.
- Updated version references in the README and the validation-document title.
- This package changed version text and documentation references; it did not introduce additional scan or handoff logic.

[Source S14](docs/CHANGELOG-SOURCES.md#s14)

## 0.4.5 copy update - Project wording

- Changed the workspace headline to “Privacy, Before You Upload.”
- Changed the workspace subheading to “AN ADDED LAYER OF PRIVACY BEFORE UPLOAD”.
- This intermediate package still reported manifest version 0.4.4.

[Source S13](docs/CHANGELOG-SOURCES.md#s13)

## 0.4.4 - Website-access and first-enable changes

- Replaced optional HTTP/HTTPS host permissions with host permissions declared in the manifest.
- Replaced the enable button’s permission request with a permission-availability check, avoiding that permission prompt in the enable flow.
- Kept per-site script registration and the injection retries introduced in the previous build.
- Updated the manifest version to 0.4.4. Website access declared by the extension became broader; per-site activation remained a separate control.

[Source S12](docs/CHANGELOG-SOURCES.md#s12)

## 0.4.3 first-enable update - Injection retries

- Added a “Starting JITO on this site…” status message.
- Added up to three attempts to inject the site script, with increasing delays and error reporting if all attempts fail.
- This was an initial change to address first-enable behavior. A later build changed the permission approach.

[Source S11](docs/CHANGELOG-SOURCES.md#s11)

## 0.4.2 image handoff update - Image handoff checks

- Added a 14 MiB output limit before relaying a cleaned copy through the extension messaging path.
- Reduced the accepted base64-message length from 22 MiB to 20 MiB and added a clearer oversized-output error.
- Added an empty-output check before constructing the file passed to the website.
- Retained the prior dropdown changes despite this package using the lower 0.4.2 filename label.

[Source S10](docs/CHANGELOG-SOURCES.md#s10)

## 0.4.3 final UI - Destination selector spacing

- Set a fixed 290-pixel width for the destination dropdown and added space between its text and chevron.
- Replaced the native dropdown appearance with a custom white chevron positioned inside the right edge.
- Added the pointer cursor to the dropdown.

[Source S09](docs/CHANGELOG-SOURCES.md#s09)

## 0.4.2 auto-close - Close the review after handoff

- Added automatic panel dismissal following a successful handoff result.
- Added a close-after-success message from the review frame and a sender-frame check in the website adapter.
- Kept dismissal on the successful handoff path. This acknowledges delivery to the website upload control, not confirmed server upload completion.

[Source S08](docs/CHANGELOG-SOURCES.md#s08)

## 0.4.1 review UI - Checkboxes, history, and result colors

- Removed the decorative hamburger-like symbol beside the filename.
- Aligned Show original text with its checkbox using the same choice-control structure as the review confirmation.
- Changed SAFE styling to green and REVIEW styling to red.
- Corrected the Clear history event binding to look up the actual button element, allowing the handler and following initial history render to run.

[Source S07](docs/CHANGELOG-SOURCES.md#s07)

## 0.4.0 UI pass - Review visibility and local history

- Added Recent reviews backed by local browser storage, retaining up to 25 entries and displaying the latest eight. Entries record filename, format/category, result, and timestamp, not file contents.
- Added SAFE and REVIEW history badges based on whether the supported scan produced findings. These labels describe the scan result, not a comprehensive privacy assessment.
- Added a Clear history control. Its event-handler binding was corrected in the next build.
- Expanded metadata descriptions with examples of what EXIF, XMP, embedded text, comments, and color-profile blocks may contain. This did not add extraction of exact GPS coordinates or individual EXIF values.
- Adjusted the workspace toward black and neutral colors, enlarged checkboxes, and revised alignment and upload-area spacing.
- Changed “Start with one file” to “Review and attach” and replaced the upload-arrow character.
- Changed the popup headline to “Share only what you choose.” and the footer to “Processed locally and shared only when you choose.”
- Placed Disable on this site above Enable JITO on this site.
- Registered the JITO icon for the extension and toolbar, replaced the em dash in the extension name with a hyphen, and removed the extra close-after-handoff paragraph.

[Source S06](docs/CHANGELOG-SOURCES.md#s06)

## 0.3.0 drag-and-drop update - File-drop checkpoint

- Added capture-phase handlers for file drop and drag-over events on enabled pages.
- Added a notice asking the user to select the dropped file again inside JITO for review.
- Opened JITO with an available compatible file input, when one could be found.
- Added removal of the drop handler when disabling the site. The anonymous drag-over handler was not removed by that cleanup.

[Source S05](docs/CHANGELOG-SOURCES.md#s05)

## 0.3.0 ChatGPT picker update - ChatGPT attachment controls

- Added a ChatGPT-specific fallback that checks visible control labels for “add files”, “attach file”, or “upload”.
- Bound matching controls to an available file input so they can open JITO before the website picker. This supplemented the generic input-click handler.

[Source S04](docs/CHANGELOG-SOURCES.md#s04)

## 0.3.0 icon update - JITO visual identity

- Replaced the letter-based logo in the popup and workspace with the supplied JITO icon.
- Added the bundled `assets/Jito-icon.png` asset and CSS to display a white version in those interfaces.
- Toolbar/manifest icon registration followed in the 0.4.0 UI build.

[Source S03](docs/CHANGELOG-SOURCES.md#s03)

## 0.3.0 - Website upload integration

- Added a generic adapter for compatible website file inputs, with a floating “Review & attach” launcher.
- Added site enable/disable controls and optional host-permission requests.
- Added interception of connected standard file-input clicks before file selection.
- Reused the review workspace inside an extension iframe, with session messages routed through a background service worker.
- Added approved cleaned-copy handoff to the selected website upload control, without automatically pressing Submit or Send.
- Added destination selection for pages with multiple upload controls, output-type checks, and checks for changed or unavailable destinations.
- Added one-use handoff sessions, cancellation/disconnection handling, and a standalone-workspace fallback.
- Included an acceptance sample and integration tests using controlled upload pages.

[Source S02](docs/CHANGELOG-SOURCES.md#s02)

## 0.1.0 - Initial standalone extension

- Added a Manifest V3 browser extension with a toolbar popup and a dedicated local review workspace.
- Added inspection of JPEG and static PNG metadata blocks, plus UTF-8 TXT, MD, CSV, and LOG files.
- Added detection of likely email addresses, US Social Security numbers, checksum-valid payment-card numbers, and selected secret-token patterns.
- Added selectable text redaction, an original-text toggle, and a sharing-copy preview.
- Added image export as a fresh PNG, output reinspection, a neutral default filename, and a review confirmation before export.
- Added input limits and rejection of unsupported, malformed, or oversized files.
- Included a built-in fictional text example and core regression tests.
- Used a manual workflow: download the cleaned copy, then upload it to the destination website. Website upload interception was not part of this build.

[Source S01](docs/CHANGELOG-SOURCES.md#s01)

