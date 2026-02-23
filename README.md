Book & Notes Vault
A modern, accessible, responsive web application for cataloguing books and personal notes. Built with semantic HTML5, CSS Flexbox, and vanilla JavaScript ES modules, no frameworks.
Demo video: https://youtu.be/TiB7qHFNjpE?si=Vp8R8wPXS5tnVamA

Overview
Book & Notes Vault allows users to:

Add, edit, and delete book and note records
Upload cover images from their device
Search records in real time using regex patterns
Sort records by title, date, or page count
Track reading statistics on a live dashboard
Import and export data as validated JSON
Switch between four visual themes (Light, Dark, Pink, Blue)





File Structure
book&note-vault/
├── index.html          Main application shell
├── tests.html          Automated regex & search test suite
├── seed.json           12 diverse sample records
├── README.md
├── styles/
│   ├── base.css        Design tokens, reset, typography, themes
│   ├── layout.css      Header, nav, main layout, breakpoints
│   └── components.css  Cards, forms, dashboard, all UI components
└── scripts/
    ├── main.js         Application controller, event binding
    ├── state.js        In-memory state management + migration
    ├── storage.js      localStorage abstraction (load/save)
    ├── ui.js           DOM rendering (dashboard + records)
    ├── validators.js   Regex validation rules
    ├── search.js       Safe regex compiler + highlight utility
    └── stats.js        Aggregate statistics calculator

Features List
FeatureStatusAdd / Edit / Delete books and notesCompleteCover image upload from deviceCompleteReal-time regex search with match highlightingCompleteSort by title, date added, or pagesCompleteDashboard with stats, 7-day trend chartCompletePage cap with ARIA live region warningsComplete4 colour themes (Light, Dark, Pink, Blue)CompleteJSON export with timestamp in filenameCompleteJSON import with structure validationCompleteLegacy record migration (type field)CompleteMobile-first responsive layout (3 breakpoints)CompleteKeyboard navigation supportCompleteSkip-to-content linkCompleteARIA landmarks, roles, live regionsCompleteInline per-field validation errorsComplete

Regex Catalog
Validation Rules
#NamePatternPurposeValid ExampleInvalid Example1Title/^\S(?:.*\S)?$/No leading, trailing, or double spaces"The Great Gatsby"" Holy Bible"2Pages`/^(0[1-9]\d*)(.\d{1,2})?$/`Positive integer or decimal (max 2dp)"320", "12.5"3Date`/^\d{4}-(0[1-9]1[0-2])-(0[1-9][12]\d3[01])$/`4Tag/^[#A-Za-z0-9]+(?:[\s\-#][A-Za-z0-9]+)*$/Letters, digits, hashes, hyphens, spaces"#fiction""!invalid"5Advanced/\b(\w+)\s+\1\b/iBack-reference: catches duplicate consecutive words—"the the book"
Search Compiler
jsexport function compileRegex(input, caseSensitive = false) {
    if (!input || !input.trim()) return null;
    try {
        return new RegExp(input.trim(), caseSensitive ? "" : "i");
    } catch {
        return null;
    }
}
Search examples:
PatternMatchesholy"Holy Bible", "Unholy..."^theTitles starting with "the"(fiction|classic)Tags containing "fiction" or "classic"\d{3,}Records with 3+ digit page counts in any fieldgatsby"The Great Gatsby"

Keyboard Map
KeyActionTabMove focus to next interactive elementShift + TabMove focus to previous interactive elementEnter / SpaceActivate focused button or linkArrow keysNavigate select dropdownsEscapeClose open dots menu on dashboardTab to skip link → EnterJump directly to main content
All interactive elements (buttons, inputs, selects, links) are fully reachable via keyboard. Focus indicators are visible via :focus-visible styles using a 2px accent-colour outline.

Accessibility Notes

Semantic landmarks: <header role="banner">, <nav role="navigation">, <main role="main">, <footer role="contentinfo">, and <section> elements with aria-labelledby
Skip link: Visible on focus, jumps to #main
ARIA live regions:

Search status: role="status" with aria-live="polite"
Field errors: role="alert" with aria-live="assertive"
Page cap: aria-live="polite" when under cap, aria-live="assertive" when exceeded


Form labels: Every input has an associated <label> via for attribute
Error association: Inputs use aria-describedby pointing to error spans
Invalid state: aria-invalid="true" set on failing inputs
Alt text: All cover images have descriptive alt attributes
Colour contrast: All theme combinations meet WCAG AA contrast ratios
Focus styles: :focus-visible outline on all interactive elements
aria-current="page" set on active nav button


Data Model
json{
  "id": "item_1234567890",
  "type": "book",
  "title": "Atomic Habits",
  "author": "James Clear",
  "pages": 320,
  "tag": "#self-help #productivity",
  "dateAdded": "2026-01-10",
  "coverUrl": "data:image/png;base64,...",
  "noteContent": "",
  "createdAt": "2026-01-10T09:15:00.000Z",
  "updatedAt": "2026-01-10T09:15:00.000Z"
}
Notes have type: "note", pages: 0, and author: "". The coverUrl field stores base64-encoded image data from device uploads.

Demo Video

The video demonstrates:

Navigating all five sections via keyboard and mouse
Adding a book with a cover image upload
Adding a note
Live regex search — edge cases including ^the, (fiction|classic), and single-letter searches
Editing and deleting via the dots menu
Sorting records by title and pages





Author
Emmanuella Gacuti
GitHub: Emmanuella2006
Email: e.gacuti@alustudent.com 
 
