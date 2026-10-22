# English prototype delivery review

**Review date:** October 21, 2026  
**Role:** consistency and visual self-review  
**Candidate:** `../Momcozy-final.html`  
**Candidate SHA-256:** `c80ab8033318bc3423dcd92d0f6aaceecdebe5949a368ddeaa0972e5a6aacd50`  
**Current Chinese source:** `../../current/index.html`, `../../current/assets/app.js`, `../../current/assets/sidebar-24.css`, `../../current/assets/today-card-26.css`  
**Source index.html SHA-256:** `c32c6e2a8bbff89034007ffc0fb51f4d563f309e5163218e34b7dfa4aee9266b`  
**Source app.js SHA-256:** `3981fb4699cb9187b982d4bffd7f0387e711be5cd3fbb0796cc17f4b52e74568`  
**Source sidebar-24.css SHA-256:** `e2f8846c9a79af00c81c0846ce9977b1f654dc1838f35488711840495b2cf4ac`  
**Browser:** desktop Chrome 155.0.8059.86, Playwright; `file://`; `en-US` locale and simulated US time zone  
**Baseline:** no user-confirmed frozen design baseline was available for this localized candidate.

## Consistency findings

- The source and English HTML have the same 86 structural ID, route, and action markers, with no markers added or removed. The English copy has one extra locale script. See `structure-evidence.json`.
- All 137 named source functions are present in the English version. Six locale and number-label helpers were added. The English storage namespace is separate from the Chinese version; seven locale and isolation checks passed. See `locale-isolation-evidence.json`.
- The side menu now matches the current Chinese source: three entries for My Care Space, Baby, and Today’s Journal. The former recommended care-tool group, badges, and profile-dependent ordering have been removed from the menu. The care shortcuts remain on Today. The 12 final-flow checks cover all three menu destinations and closing with Escape. See `final-flow-evidence.json` and `screenshots/final-main-menu.png`.
- The current centered Today pager was carried over, including dots inside the card, cyclic swipe and arrow-key navigation, and focus restoration. The older arrow buttons and tip-basis sheet were removed to match the current source. See `final-flow-evidence.json`.
- Browser checks found no visible untranslated Chinese interface text in 15 screenshot states and 40 additional secondary or flow states. Chinese entered by a user remains visible as entered. See `browser-evidence.json` and `expanded-evidence.json`.
- Current-flow checks covered consecutive care cards, draft transfer, same-request save recovery, page refresh during save, late intent handling, and a dark 360 × 640 viewport. See `current-flow-evidence.json`.

## Visual evidence reviewed

The screenshot operator was Playwright in desktop Chrome 155. Captures are viewport screenshots, not full-page screenshots. The screenshot paths and hashes for the 15 state captures are recorded in `browser-evidence.json`; the final-flow and dark short-screen screenshot paths and hashes are recorded in `final-flow-evidence.json` and `current-flow-evidence.json`. All of these evidence files identify the candidate SHA-256 above. The `viewport-evidence.json` file identifies the same candidate and covers Today, Care Journal, and My Care Space at widths of 360, 390, 430, and 1280 px.

| Page and state | Viewport | Evidence | Review observation |
| --- | --- | --- | --- |
| First-time setup, role/details/concerns/tools | 390 × 844 | `screenshots/01-onboarding-role.png` through `04-onboarding-tools.png` | English choices and labels remain readable; no visible overlap. |
| Today, first visit | 390 × 844 | `screenshots/05-home-first-visit.png` | One centered pager and conversation composer fit the existing layout. |
| Main menu, open | 390 × 844 | `screenshots/final-main-menu.png` | The three entries and close control fit the side panel; the care tools remain accessible from Today. |
| Today, expanded tip and user message | 390 × 844 | `screenshots/final-today-tip-expanded.png` | Tip remains readable; the user-entered Chinese message is preserved verbatim. |
| Care Journal, empty and record form | 390 × 844 | `screenshots/06-journal-empty.png`, `09-record-picker.png`, `10-breastfeeding-form.png` | New-entry button and form controls remain visible and readable. |
| My Care Space and settings sheets | 390 × 844 | `screenshots/07-my-menu.png`, `13-settings.png`, `14-my-care-space.png` | English labels wrap within the panels. |
| Care card, ready state | 390 × 844 | `screenshots/11-cry-care-card.png` | Title, action, and companion illustration are visible. |
| Active care card, dark short screen | 360 × 640 | `screenshots/current-dark-360.png` | The card scrolls beneath a visible composer; the screenshot shows only its top portion because it is viewport-limited. |
| Today and journal, desktop preview | 1280 × 900 | `screenshots/viewport-home-1280.png`, `viewport-journal-1280.png` | Preview frame and editorial rail remain aligned. |

Automated overflow checks reported zero horizontal overflow in the sampled viewports and record forms. See `viewport-evidence.json` and `overflow-evidence.json`. The 57-state matrix, save scenarios, and profile limits checks reported zero errors, but their scripts are a self-check and some do not embed the file SHA-256 in their JSON. They were rerun against the final file before this review; the hash-bound visual and flow evidence above is the material-specific delivery evidence.

## Limits and challenge review

The strongest alternative explanation for a clean translation check is that the English overlay hides untranslated strings only in visited states. The 40 secondary-state run, 57-state matrix, profile-limit cases, and visible-attribute inspection reduce that risk but do not prove every possible stored-data combination. No independent reviewer or user design sign-off was recorded. Browser media capture was exercised only to the extent allowed by the test environment, and mobile keyboard, physical devices, and screen readers remain unverified.

**Disposition:** reviewable localized prototype candidate; no blocker found in the tested flows and viewports. Do not treat this review as production certification or design freeze.
