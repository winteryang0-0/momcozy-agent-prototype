# Momcozy AI · English HTML prototype

This is the en-US version of the current Berry & Air interactive prototype. Open [Momcozy-final.html](Momcozy-final.html) directly in a desktop browser. The file contains its styles, scripts, and companion image, so it works from `file://` without a server. A modular editing copy is available as [index.html](index.html) with its files in `assets/`.

The English prototype keeps the same page and control structure as the current Chinese source: first-time setup, Today and chat, Care Journal, My Care Space, care cards, record editing, settings, and secondary sheets. The main menu has three entries: My Care Space, Baby, and Today’s Journal; the care shortcuts remain on Today. Today tips use the current centered pager, swipe, and keyboard arrow behavior. Dates and times are shown in the browser’s local en-US format. The English version uses separate browser storage keys based on `momcozy-home-1.0-en-US`; it does not migrate or reset the Chinese version’s data. Names, notes, and messages entered by the user remain as entered.

## Prototype scope

- Care entries and conversation history are saved in this browser when storage is available.
- Care card capture uses the browser’s microphone or camera when available and permitted. A real device and browser permission are needed to try those controls.
- Automated AI analysis, voice transcription, chat replies, attachments, device connection, account sync, and their scenario controls are simulated for interaction review. The prototype does not provide medical diagnosis or advice.

## Verification

The final single-file SHA-256 is `c80ab8033318bc3423dcd92d0f6aaceecdebe5949a368ddeaa0972e5a6aacd50`. Review evidence is in [delivery-review](delivery-review/): 15 captured interface states, 40 additional secondary or flow states, 57 state-matrix checks, 12 final-flow checks, 9 current-flow checks, 7 locale and storage-isolation checks, and 360, 390, 430, and 1280 px viewport samples. The evidence was captured in desktop Chrome 155 through Playwright with a simulated en-US browser environment. Mobile keyboard behavior, screen-reader operation, and physical microphone or camera performance were not verified.

This delivery is a prototype candidate. The checks and screenshots are a self-review of the current file, not an independent visual approval or a frozen design baseline.
