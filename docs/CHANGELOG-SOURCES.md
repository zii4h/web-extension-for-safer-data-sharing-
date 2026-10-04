# Changelog source notes

This appendix records the primary source for each changelog entry: the saved ZIP package and its file contents. Prepared on 5 October 2026. Preparation date is not a release date.

## Method

- Opened all 14 available ZIPs and compared their packaged files. No application code was changed.
- Used the conversation sequence and cumulative source changes to order builds where filename versions conflict. This is reconstructed build history, not a Git commit log or verified public-release timeline.
- Ignored whitespace-only changes when describing functionality. The changed-file lists below include byte changes, including whitespace.
- Used code to establish implemented behavior. Archive names containing “fix” were not treated as proof that a bug was resolved on every website or browser.
- Did not run application tests for this documentation task. Existing validation notes describe earlier testing; changing their version header is not evidence of a fresh test run.
- No GitHub repository URL or historical commit IDs were supplied, so no commit or release links have been invented. ZIP names and SHA-256 digests identify the inspected sources.

## Package inventory

| Source | Saved ZIP | Manifest version |
|---|---|---|
| [S01](#s01) | `JITO-extension-v0.1.0.zip` | `0.1.0` |
| [S02](#s02) | `JITO-extension-v0.3.0.zip` | `0.3.0` |
| [S03](#s03) | `JITO-extension-v0.3.0-icon.zip` | `0.3.0` |
| [S04](#s04) | `JITO-extension-v0.3.0-chatgpt-fix.zip` | `0.3.0` |
| [S05](#s05) | `JITO-extension-v0.3.0-chatgpt-dnd-fix.zip` | `0.3.0` |
| [S06](#s06) | `JITO-extension-v0.4.0-ui-pass.zip` | `0.3.0` |
| [S07](#s07) | `JITO-extension-v0.4.1-review-ui.zip` | `0.3.0` |
| [S08](#s08) | `JITO-extension-v0.4.2-auto-close.zip` | `0.3.0` |
| [S09](#s09) | `JITO-extension-v0.4.3-final-ui.zip` | `0.3.0` |
| [S10](#s10) | `JITO-extension-v0.4.2-image-handoff-fix.zip` | `0.3.0` |
| [S11](#s11) | `JITO-extension-v0.4.3-first-enable-fix.zip` | `0.3.0` |
| [S12](#s12) | `JITO-extension-v0.4.4-first-enable-fixed.zip` | `0.4.4` |
| [S13](#s13) | `JITO-extension-v0.4.5-copy-update.zip` | `0.4.4` |
| [S14](#s14) | `JITO-extension-v0.4.5-updated.zip` | `0.4.5` |

## Interpretation notes

- No saved 0.2.x source was available. That version is not reconstructed from guesses.
- Packages labeled 0.4.0, 0.4.1, 0.4.2, and both 0.4.3 variants still report manifest version 0.3.0. The 0.4.5 copy-update package reports 0.4.4.
- The 0.4.2 image-handoff package retains the 0.4.3 final-UI changes. It follows that UI build in this reconstruction despite its filename number.
- Some later README/UI/validation statements lag behind the code, including optional-permission descriptions and drop-coverage text. The changelog uses the corresponding code differences as evidence.
- Automatic close follows browser-side handoff, not proof of completed server upload. Metadata descriptions list possible contents rather than extracting exact GPS or author values.

<a id="s01"></a>

## S01: 0.1.0

**Package:** `JITO-extension-v0.1.0.zip`  
**Manifest version:** `0.1.0`  
**Compared with:** `No earlier implementation package available`  
**Primary files inside `jito/`:** core.js; workspace.js; manifest.json; tests/core.test.cjs

**Evidence:** Initial source includes image parsers, text scanning and redaction, preview/export handling, and a Manifest V3 popup. The manifest has no website adapter or background service worker.

**Files with byte changes:** `core.js`, `manifest.json`, `popup.html`, `popup.js`, `README.md`, `styles.css`, `VALIDATION.md`, `workspace.html`, `workspace.js`, `tests/core.test.cjs`

**SHA-256:**
```text
d551f59d5ab489616d9bd17b922188a95e6aece0eff45a87cf10028f518e71ca
```

<a id="s02"></a>

## S02: 0.3.0

**Package:** `JITO-extension-v0.3.0.zip`  
**Manifest version:** `0.3.0`  
**Compared with:** `JITO-extension-v0.1.0.zip`  
**Primary files inside `jito/`:** site.js; background.js; integration.js; popup.js; manifest.json; tests/integration.test.cjs

**Evidence:** `chrome.runtime.connect({name:'jito-host'})`; `frame.src=chrome.runtime.getURL('workspace.html')+'#attach='+message.token`; approved output is assigned to `input.files` and dispatches `input` and `change` events.

**Files with byte changes:** `acceptance-sample.txt`, `background.js`, `integration.js`, `manifest.json`, `popup.html`, `popup.js`, `README.md`, `site.js`, `styles.css`, `VALIDATION.md`, `workspace.html`, `workspace.js`, `tests/integration.test.cjs`

**SHA-256:**
```text
d187486dcd76e1c8e3a19e35317bdd3a1dc3a486428f0f09580d76df2636acc6
```

<a id="s03"></a>

## S03: 0.3.0 icon update

**Package:** `JITO-extension-v0.3.0-icon.zip`  
**Manifest version:** `0.3.0`  
**Compared with:** `JITO-extension-v0.3.0.zip`  
**Primary files inside `jito/`:** popup.html; workspace.html; styles.css; assets/Jito-icon.png

**Evidence:** Logo markup references `assets/Jito-icon.png`; `.logo img` uses `filter: brightness(0) invert(1)`. The manifest is unchanged in this package.

**Files with byte changes:** `popup.html`, `styles.css`, `workspace.html`, `assets/Jito-icon.png`

**SHA-256:**
```text
bf74f4a6038675e83c1989bc6787b43c4e45388d122821baa4cc23e93e7177d3
```

<a id="s04"></a>

## S04: 0.3.0 ChatGPT picker update

**Package:** `JITO-extension-v0.3.0-chatgpt-fix.zip`  
**Manifest version:** `0.3.0`  
**Compared with:** `JITO-extension-v0.3.0-icon.zip`  
**Primary files inside `jito/`:** site.js

**Evidence:** The new fallback checks `location.hostname==='chatgpt.com'` and `/add files|attach file|upload/.test(label)`, then selects an available file input.

**Files with byte changes:** `site.js`

**SHA-256:**
```text
424a1097ea7a2d4f3b2c6b7d66e32fd4002594c580af815ec0ff71388aced06a
```

<a id="s05"></a>

## S05: 0.3.0 drag-and-drop update

**Package:** `JITO-extension-v0.3.0-chatgpt-dnd-fix.zip`  
**Manifest version:** `0.3.0`  
**Compared with:** `JITO-extension-v0.3.0-chatgpt-fix.zip`  
**Primary files inside `jito/`:** site.js

**Evidence:** Adds `window.addEventListener('drop',interceptDrop,true)` and a drag-over listener. `interceptDrop` stops the event, displays a reselect-in-JITO notice, and calls `open(compatible||null)`. Disable removes `interceptDrop` but not the anonymous drag-over listener.

**Files with byte changes:** `site.js`

**SHA-256:**
```text
79a76e4ca827bc69c878e9bee7f80e0624c5b4943e8aca200b90297202632909
```

<a id="s06"></a>

## S06: 0.4.0 UI pass

**Package:** `JITO-extension-v0.4.0-ui-pass.zip`  
**Manifest version:** `0.3.0`  
**Compared with:** `JITO-extension-v0.3.0-chatgpt-dnd-fix.zip`  
**Primary files inside `jito/`:** core.js; workspace.js; workspace.html; popup.html; styles.css; manifest.json; integration.js

**Evidence:** Adds `HISTORY_KEY='jito-local-review-history'`, `items.slice(0,25)` for storage, and `items.slice(0,8)` for display. EXIF descriptions say “may include GPS/location”; no new field-value parser appears. This build ends with the erroneous `clear-history?.addEventListener(...)` expression.

**Files with byte changes:** `acceptance-sample.txt`, `background.js`, `core.js`, `integration.js`, `manifest.json`, `popup.html`, `popup.js`, `README.md`, `site.js`, `styles.css`, `VALIDATION.md`, `workspace.html`, `workspace.js`

**SHA-256:**
```text
c14d6aabd3b5f95fb6713c6a8beb8c891fa16d71022b889a915eb5b6cc1cde2f
```

<a id="s07"></a>

## S07: 0.4.1 review UI

**Package:** `JITO-extension-v0.4.1-review-ui.zip`  
**Manifest version:** `0.3.0`  
**Compared with:** `JITO-extension-v0.4.0-ui-pass.zip`  
**Primary files inside `jito/`:** workspace.js; workspace.html; styles.css

**Evidence:** Replaces `clear-history?.addEventListener(...)` with `$('clear-history')?.addEventListener(...)`. Adds `.reveal-choice` alignment and green/red status styles; removes the filename symbol from markup.

**Files with byte changes:** `styles.css`, `workspace.html`, `workspace.js`

**SHA-256:**
```text
f6ca4eb0bdfdb701bf5d38775c6d6c5ef835b00d03a1eed866edaef71e621419
```

<a id="s08"></a>

## S08: 0.4.2 auto-close

**Package:** `JITO-extension-v0.4.2-auto-close.zip`  
**Manifest version:** `0.3.0`  
**Compared with:** `JITO-extension-v0.4.1-review-ui.zip`  
**Primary files inside `jito/`:** integration.js; site.js; workspace.js

**Evidence:** Adds `closeAfterSuccess`, `jito-close-after-success`, a frame-source check, and `setTimeout(dismiss,250)` after successful input assignment/event dispatch. There is no server-completion acknowledgment in this change.

**Files with byte changes:** `integration.js`, `site.js`, `workspace.js`

**SHA-256:**
```text
52aa28317606ea9630425bab22a52749f040ed9eb12dab664a0e789e7a3e4107
```

<a id="s09"></a>

## S09: 0.4.3 final UI

**Package:** `JITO-extension-v0.4.3-final-ui.zip`  
**Manifest version:** `0.3.0`  
**Compared with:** `JITO-extension-v0.4.2-auto-close.zip`  
**Primary files inside `jito/`:** site.js

**Evidence:** Destination select changes include `width:290px`, `padding-right:34px`, `appearance:none`, `background-position:right 11px center`, and `button,select{cursor:pointer}`.

**Files with byte changes:** `site.js`

**SHA-256:**
```text
63749b5794cac767ace974edb36395a778fad1dd1c771d553b5dbe22235142a1
```

<a id="s10"></a>

## S10: 0.4.2 image handoff update

**Package:** `JITO-extension-v0.4.2-image-handoff-fix.zip`  
**Manifest version:** `0.3.0`  
**Compared with:** `JITO-extension-v0.4.3-final-ui.zip`  
**Primary files inside `jito/`:** background.js; integration.js; site.js

**Evidence:** Adds `if(blob.size>14*1024*1024)`, changes the base64-length bound to `20*1024*1024`, and checks `if(!bytes.byteLength)` before constructing the output File.

**Files with byte changes:** `background.js`, `integration.js`, `site.js`

**SHA-256:**
```text
c9d0ded453d2a7608a3e2b13cf21fd8a851922e0c520658943356d901a974d02
```

<a id="s11"></a>

## S11: 0.4.3 first-enable update

**Package:** `JITO-extension-v0.4.3-first-enable-fix.zip`  
**Manifest version:** `0.3.0`  
**Compared with:** `JITO-extension-v0.4.2-image-handoff-fix.zip`  
**Primary files inside `jito/`:** popup.js

**Evidence:** Adds `for(let attempt=0;attempt<3;attempt++)`, a delay of `150*(attempt+1)`, a Starting status, and a final `if(lastError)throw lastError`.

**Files with byte changes:** `popup.js`

**SHA-256:**
```text
0736f3db58c854285235021c45af779e815a3e07527df70920d83ac2b4c93ed1
```

<a id="s12"></a>

## S12: 0.4.4

**Package:** `JITO-extension-v0.4.4-first-enable-fixed.zip`  
**Manifest version:** `0.4.4`  
**Compared with:** `JITO-extension-v0.4.3-first-enable-fix.zip`  
**Primary files inside `jito/`:** manifest.json; popup.js

**Evidence:** Changes `optional_host_permissions` to `host_permissions` for HTTP/HTTPS. Replaces `chrome.permissions.request(...)` with `chrome.permissions.contains(...)`. The manifest version becomes 0.4.4.

**Files with byte changes:** `manifest.json`, `popup.js`

**SHA-256:**
```text
eaf9d38bac9ced51cefd6236722d5a736636b5dc4b7bc38ae13e00b003146d6c
```

<a id="s13"></a>

## S13: 0.4.5 copy update

**Package:** `JITO-extension-v0.4.5-copy-update.zip`  
**Manifest version:** `0.4.4`  
**Compared with:** `JITO-extension-v0.4.4-first-enable-fixed.zip`  
**Primary files inside `jito/`:** workspace.html

**Evidence:** Changes the hero copy and subheading only. The archive manifest still says 0.4.4 and the on-screen release label still says 0.3.

**Files with byte changes:** `workspace.html`

**SHA-256:**
```text
d4c2d250ae932626fcfa70d07eead054e938d5f59562961a999e2b6ec80c7c26
```

<a id="s14"></a>

## S14: 0.4.5

**Package:** `JITO-extension-v0.4.5-updated.zip`  
**Manifest version:** `0.4.5`  
**Compared with:** `JITO-extension-v0.4.5-copy-update.zip`  
**Primary files inside `jito/`:** manifest.json; popup.html; workspace.html; README.md; VALIDATION.md

**Evidence:** Changes version labels to 0.4.5. The validation title changes, but its test narrative is carried forward without a new test implementation or execution record in this package.

**Files with byte changes:** `manifest.json`, `popup.html`, `README.md`, `VALIDATION.md`, `workspace.html`

**SHA-256:**
```text
9f390710361d5f3077b42f1ff5ed75f105602548d3a69fe17651073c6b57ba0b
```

