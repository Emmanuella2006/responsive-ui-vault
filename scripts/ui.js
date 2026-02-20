import { books, deleteBook } from "./state.js";
import { compileRegex, highlight } from "./search.js";
import { calculateStats } from "./stats.js";

var PLACEHOLDER = "https://placehold.co/200x300/e0e4ea/6b7280?text=No+Cover";

// ── Records view ──────────────────────────────────────────────────────────────

export function renderRecords() {
    var container = document.getElementById("recordsContainer");
    var input     = document.getElementById("searchInput").value;
    var sortField = document.getElementById("sortField").value;
    var ascending = document.getElementById("sortDir").textContent === "ASC";
    var status    = document.getElementById("searchStatus");

    var regex = compileRegex(input, false);
    container.innerHTML = "";

    var filtered = books.filter(function (item) {
        if (!input.trim()) return true;
        if (!regex) return false;
        return regex.test(item.title)
            || regex.test(item.author || "")
            || regex.test(item.tag    || "")
            || regex.test(item.noteContent || "");
    });

    filtered.sort(function (a, b) {
        var av = sortField === "pages" ? Number(a[sortField]) : (a[sortField] || "");
        var bv = sortField === "pages" ? Number(b[sortField]) : (b[sortField] || "");
        if (av < bv) return ascending ? -1 :  1;
        if (av > bv) return ascending ?  1 : -1;
        return 0;
    });

    status.textContent = input.trim()
        ? filtered.length + " result" + (filtered.length !== 1 ? "s" : "") + " found."
        : "";

    if (!filtered.length) {
        container.innerHTML = "<p class=\"empty-state\">"
            + (input.trim() ? "No records matched your query." : "No records yet. Add your first item.")
            + "</p>";
        return;
    }

    filtered.forEach(function (item) {
        var card   = document.createElement("article");
        card.className = "card";
        card.setAttribute("aria-label", item.title);

        var isNote = item.type === "note";
        var cover  = item.coverUrl || PLACEHOLDER;

        card.innerHTML =
            "<div class=\"card-cover" + (isNote ? " note-cover" : "") + "\">"
            + (isNote
                ? "<span class=\"note-thumb\" aria-hidden=\"true\">N</span>"
                : "<img src=\"" + cover + "\" alt=\"Cover: " + item.title + "\" loading=\"lazy\" onerror=\"this.src='" + PLACEHOLDER + "'\" />")
            + "</div>"
            + "<div class=\"card-body\">"
            +   "<span class=\"card-type-badge " + (isNote ? "badge-note" : "badge-book") + "\">" + (isNote ? "Note" : "Book") + "</span>"
            +   "<h3>" + highlight(item.title, regex) + "</h3>"
            + (!isNote
                ? "<p><strong>Author:</strong> " + highlight(item.author || "", regex) + "</p>"
                + "<p><strong>Pages:</strong> " + item.pages + " " + (window._pageUnit || "pages") + "</p>"
                : "")
            + (isNote && item.noteContent
                ? "<p class=\"note-excerpt\">" + highlight(item.noteContent.slice(0, 100), regex) + (item.noteContent.length > 100 ? "&hellip;" : "") + "</p>"
                : "")
            +   "<p><strong>Tag:</strong> " + highlight(formatTag(item.tag), regex) + "</p>"
            +   "<p><strong>Date:</strong> " + item.dateAdded + "</p>"
            +   "<div class=\"card-actions\">"
            +     "<button class=\"btn-edit\" aria-label=\"Edit " + item.title + "\">Edit</button>"
            +     "<button class=\"btn-delete\" aria-label=\"Delete " + item.title + "\">Delete</button>"
            +   "</div>"
            + "</div>";

        card.querySelector(".btn-edit").addEventListener("click", function () {
            window.editBook(item.id);
        });

        card.querySelector(".btn-delete").addEventListener("click", function () {
            if (window.confirm("Permanently delete \"" + item.title + "\"?")) {
                deleteBook(item.id);
                renderRecords();
                renderDashboard();
            }
        });

        container.appendChild(card);
    });
}

// ── Dashboard view ────────────────────────────────────────────────────────────

export function renderDashboard() {
    var dash   = document.getElementById("dashContent");
    var query  = document.getElementById("dashSearch").value;
    var regex  = compileRegex(query, false);
    var stats  = calculateStats(books);
    var cap    = window._pageCap  || 0;
    var unit   = window._pageUnit || "pages";

    var displayed = query.trim()
        ? books.filter(function (b) {
            return regex && (
                regex.test(b.title)
                || regex.test(b.author || "")
                || regex.test(b.tag    || "")
                || regex.test(b.noteContent || "")
            );
          })
        : books;

    var capExceeded = cap > 0 && stats.totalPages > cap;
    var capAriaLive = capExceeded ? "assertive" : "polite";
    var capLabel    = cap > 0
        ? (capExceeded
            ? "Cap exceeded by " + (stats.totalPages - cap).toLocaleString() + " " + unit
            : (cap - stats.totalPages).toLocaleString() + " " + unit + " remaining")
        : "";

    var html = "";

    // Hero
    html += "<div class=\"dash-hero\">"
        +   "<div class=\"dash-hero-text\">"
        +     "<h2 id=\"dash-heading\">Your Vault</h2>"
        +     "<p>Manage your books and notes in one place.</p>"
        +   "</div>"
        +   "<button class=\"dash-add-btn\" id=\"dashAddBtn\">Add Item</button>"
        + "</div>";

    // Grid or empty state
    if (displayed.length === 0) {
        html += "<div class=\"dash-empty\">"
            +   "<div class=\"dash-empty-icon\" aria-hidden=\"true\"></div>"
            +   "<h3>" + (query.trim() ? "No results found" : "Your vault is empty") + "</h3>"
            +   "<p>" + (query.trim() ? "Try adjusting your search term." : "Begin by adding your first book or note.") + "</p>"
            + "</div>";
    } else {
        html += "<div class=\"dash-book-grid\" role=\"list\">";
        displayed.forEach(function (item) {
            var isNote = item.type === "note";
            var cover  = item.coverUrl || PLACEHOLDER;

            html += "<div class=\"dash-book-card\" role=\"listitem\">"
                +   "<div class=\"dash-book-cover" + (isNote ? " note-cover" : "") + "\">"
                +     (isNote
                        ? "<span class=\"note-thumb-lg\" aria-hidden=\"true\">N</span>"
                        : "<img src=\"" + cover + "\" alt=\"Cover: " + item.title + "\" loading=\"lazy\" onerror=\"this.src='" + PLACEHOLDER + "'\" />")
                +     "<button class=\"dots-btn\" aria-label=\"Options for " + item.title + "\" data-id=\"" + item.id + "\">&#8943;</button>"
                +     "<div class=\"dots-menu\" id=\"dots-" + item.id + "\" role=\"menu\">"
                +       "<button role=\"menuitem\" data-action=\"edit\" data-id=\"" + item.id + "\">Edit</button>"
                +       "<button role=\"menuitem\" class=\"dots-delete\" data-action=\"delete\" data-id=\"" + item.id + "\">Delete</button>"
                +     "</div>"
                +   "</div>"
                +   "<div class=\"dash-book-info\">"
                +     "<p class=\"dash-book-title\">" + highlight(item.title, regex) + "</p>"
                +     "<p class=\"dash-book-author\">" + (isNote ? "Note" : highlight(item.author || "", regex)) + "</p>"
                +     "<span class=\"tag\">" + formatTag(item.tag) + "</span>"
                +   "</div>"
                + "</div>";
        });
        html += "</div>";
    }

    dash.innerHTML = html;

    // Bind hero add button
    var addBtn = document.getElementById("dashAddBtn");
    if (addBtn) {
        addBtn.addEventListener("click", function () {
            document.querySelector("[data-view='add']").click();
        });
    }

    // Bind dots menus
    dash.querySelectorAll(".dots-btn").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            var id   = btn.dataset.id;
            var menu = document.getElementById("dots-" + id);
            closeAllDotMenus(menu);
            menu.classList.toggle("open");
        });
    });

    dash.querySelectorAll("[data-action]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            var action = btn.dataset.action;
            var id     = btn.dataset.id;
            closeAllDotMenus();

            if (action === "edit") {
                window.editBook(id);
            } else if (action === "delete") {
                var item = books.find(function (b) { return b.id === id; });
                if (window.confirm("Permanently delete \"" + (item ? item.title : id) + "\"?")) {
                    deleteBook(id);
                    renderDashboard();
                    renderRecords();
                }
            }
        });
    });

    // Close menus on outside click
    document.addEventListener("click", function () { closeAllDotMenus(); }, { once: true });
}

function closeAllDotMenus(except) {
    document.querySelectorAll(".dots-menu.open").forEach(function (m) {
        if (m !== except) m.classList.remove("open");
    });
}

/**
 * Ensures each word in a tag string is prefixed with a hash symbol.
 * e.g. "dreams revelation" -> "#dreams #revelation"
 *      "#Jesus #yahweh"   -> "#Jesus #yahweh" (already has hashes)
 * @param {string} tag
 * @returns {string}
 */
function formatTag(tag) {
    if (!tag) return "";
    return tag.split(/\s+/).map(function (word) {
        return word.startsWith("#") ? word : "#" + word;
    }).join(" ");
}