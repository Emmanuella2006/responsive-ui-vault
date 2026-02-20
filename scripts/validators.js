// ── Regex Rules ──────────────────────────────────────────
// 1. Title: no leading/trailing spaces, no double spaces
const TITLE_RE = /^\S(?:.*\S)?$/;
// 2. Pages: positive integer
const PAGES_RE = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
// 3. Date: YYYY-MM-DD strict
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
// 4. Tag: letters, spaces, hyphens, and # allowed
const TAG_RE = /^[#A-Za-z]+(?:[ \-#][A-Za-z]+)*$/;
// 5. ADVANCED – lookahead: detect duplicate consecutive words (e.g. "the the")
const DUP_WORD_RE = /\b(\w+)\s+\1\b/i;

export function validateItem(item) {
    const errors = {};

    // Title
    if (!item.title) {
        errors.title = "Title is required.";
    } else if (!TITLE_RE.test(item.title)) {
        errors.title = "Title must not have leading/trailing or double spaces.";
    } else if (DUP_WORD_RE.test(item.title)) {
        errors.title = "Title contains a duplicate consecutive word.";
    }

    // Author (books only)
    if (item.type === 'book') {
        if (!item.author) {
            errors.author = "Author is required.";
        } else if (!TITLE_RE.test(item.author)) {
            errors.author = "Author must not have leading/trailing spaces.";
        }
        // Pages
        if (!item.pages && item.pages !== 0) {
            errors.pages = "Pages is required.";
        } else if (!PAGES_RE.test(String(item.pages))) {
            errors.pages = "Pages must be a positive number.";
        }
    }

    // Tag — allow #, letters, spaces, hyphens
    if (!item.tag) {
        errors.tag = "Tag is required.";
    } else if (!TAG_RE.test(item.tag)) {
        errors.tag = "Tag: use letters, #, spaces, or hyphens (e.g. #sci-fi).";
    }

    // Date — only validate if filled in
    if (!item.dateAdded) {
        errors.date = "Date is required.";
    } else if (!DATE_RE.test(item.dateAdded)) {
        errors.date = "Date must be in YYYY-MM-DD format.";
    }

    return errors;
}

export { TITLE_RE, PAGES_RE, DATE_RE, TAG_RE, DUP_WORD_RE };