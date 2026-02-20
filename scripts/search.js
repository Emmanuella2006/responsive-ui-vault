export function compileRegex(input, caseSensitive) {
    try {
        return input ? new RegExp(input, caseSensitive ? "" : "i") : null;
    } catch {
        return null;
    }
}

export function highlight(text, regex) {
    if (!regex) return text;
    return text.replace(regex, m => `<mark>${m}</mark>`);
}