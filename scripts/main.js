import { addBook, updateBook, books } from "./state.js";
import * as State from "./state.js";
import { validateItem } from "./validators.js";
import { renderRecords, renderDashboard } from "./ui.js";
import { loadSettings, saveSettings, save } from "./storage.js";

document.addEventListener("DOMContentLoaded", function () {

    applyPersistedSettings();
    renderDashboard();
    renderRecords();
    bindTypeToggle();
    bindCoverPreview();
    bindNavigaton();
    bindSearch();
    bindSort();
    bindForm();
    bindSettings();
    bindImportExport();

});

// ── Navigation ────────────────────────────────────────────────────────────────

function bindNavigaton() {
    var navButtons = document.querySelectorAll("nav button[data-view]");

    navButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
            navigateTo(btn.dataset.view);
        });
    });

    navigateTo("dashboard");
}

function navigateTo(viewId) {
    document.querySelectorAll(".view").forEach(function (v) {
        v.classList.add("hidden");
    });
    document.querySelectorAll("nav button[data-view]").forEach(function (b) {
        b.classList.remove("active");
        b.removeAttribute("aria-current");
    });

    var target = document.getElementById(viewId);
    var btn = document.querySelector("[data-view='" + viewId + "']");

    if (target) target.classList.remove("hidden");
    if (btn) {
        btn.classList.add("active");
        btn.setAttribute("aria-current", "page");
    }
}

// ── Type toggle (book vs note) ────────────────────────────────────────────────

function bindTypeToggle() {
    var typeSelect = document.getElementById("itemType");
    if (!typeSelect) return;

    typeSelect.addEventListener("change", function () {
        applyTypeLayout(typeSelect.value);
    });
}

function applyTypeLayout(type) {
    var isNote = type === "note";
    document.getElementById("authorGroup").style.display = isNote ? "none" : "";
    document.getElementById("pagesGroup").style.display  = isNote ? "none" : "";
    document.getElementById("noteContentGroup").style.display = isNote ? "" : "none";
}

// ── Cover image preview ───────────────────────────────────────────────────────

function bindCoverPreview() {
    var input   = document.getElementById("coverFile");
    var preview = document.getElementById("coverPreview");
    if (!input || !preview) return;

    input.addEventListener("change", function () {
        var file = input.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.classList.remove("hidden");
        } else {
            preview.classList.add("hidden");
        }
    });
}

// ── Search ────────────────────────────────────────────────────────────────────

function bindSearch() {
    var dashInput    = document.getElementById("dashSearch");
    var recordsInput = document.getElementById("searchInput");

    if (dashInput)    dashInput.addEventListener("input", renderDashboard);
    if (recordsInput) recordsInput.addEventListener("input", renderRecords);
}

// ── Sorting ───────────────────────────────────────────────────────────────────

function bindSort() {
    var sortField = document.getElementById("sortField");
    var sortDir   = document.getElementById("sortDir");

    if (sortField) sortField.addEventListener("change", renderRecords);

    if (sortDir) {
        sortDir.addEventListener("click", function () {
            var isAsc = sortDir.textContent === "ASC";
            sortDir.textContent = isAsc ? "DESC" : "ASC";
            sortDir.setAttribute("aria-label", "Sort direction: " + (isAsc ? "descending" : "ascending"));
            renderRecords();
        });
    }
}

// ── Form ──────────────────────────────────────────────────────────────────────

function bindForm() {
    var form = document.getElementById("itemForm");
    if (!form) return;

    ["title", "author", "pages", "tag", "dateAdded"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener("blur", function () { validateSingleField(id); });
    });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        await handleFormSubmit();
    });
}

async function handleFormSubmit() {
    var form      = document.getElementById("itemForm");
    var editingId = form.dataset.editingId || null;
    var existing  = editingId ? State.books.find(function (b) { return b.id === editingId; }) : null;
    var type      = document.getElementById("itemType").value;

    var coverBase64 = await readFileAsBase64(document.getElementById("coverFile"))
        || (existing ? existing.coverUrl : "");

    var item = {
        id:          editingId || ("item_" + Date.now()),
        type:        type,
        title:       document.getElementById("title").value.trim(),
        author:      type === "book" ? document.getElementById("author").value.trim() : "",
        pages:       type === "book" ? Number(document.getElementById("pages").value) : 0,
        tag:         document.getElementById("tag").value.trim(),
        dateAdded:   document.getElementById("dateAdded").value,
        noteContent: type === "note" ? document.getElementById("noteContent").value.trim() : "",
        coverUrl:    coverBase64,
        createdAt:   existing ? existing.createdAt : new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
    };

    var errors  = validateItem(item);
    var status  = document.getElementById("formStatus");

    clearFieldErrors();

    if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(function ([field, msg]) {
            var errId = field === "date" ? "dateErr" : field + "Err";
            var errEl = document.getElementById(errId);
            var input = document.getElementById(field === "date" ? "dateAdded" : field);
            if (errEl) errEl.textContent = msg;
            if (input) input.setAttribute("aria-invalid", "true");
        });
        setStatus(status, "Please resolve the errors above before saving.", "error");
        return;
    }

    if (editingId) {
        updateBook(item);
        setStatus(status, "Record updated successfully.", "success");
        delete form.dataset.editingId;
        document.querySelector("#form-heading").textContent = "Add Item";
        document.querySelector("#itemForm button[type='submit']").textContent = "Save Item";
    } else {
        addBook(item);
        setStatus(status, "Record saved successfully.", "success");
    }

    form.reset();
    clearFieldErrors();
    document.getElementById("coverPreview").classList.add("hidden");
    applyTypeLayout("book");
    renderRecords();
    renderDashboard();
}

// ── Settings ──────────────────────────────────────────────────────────────────

function bindSettings() {
    var pageCapInput  = document.getElementById("pageCap");
    var pageUnitInput = document.getElementById("pageUnit");

    if (pageCapInput)  pageCapInput.addEventListener("change", persistSettings);
    if (pageUnitInput) pageUnitInput.addEventListener("change", persistSettings);
}

function persistSettings() {
    var cap  = Number(document.getElementById("pageCap").value) || 0;
    var unit = document.getElementById("pageUnit").value;

    saveSettings({ pageCap: cap, pageUnit: unit });
    window._pageCap  = cap;
    window._pageUnit = unit;

    setStatus(document.getElementById("settingsStatus"), "Settings saved.", "success");
    renderDashboard();
}

function applyPersistedSettings() {
    var s = loadSettings();
    window._pageCap  = s.pageCap  || 0;
    window._pageUnit = s.pageUnit || "pages";

    var capEl  = document.getElementById("pageCap");
    var unitEl = document.getElementById("pageUnit");

    if (capEl  && s.pageCap)  capEl.value  = s.pageCap;
    if (unitEl && s.pageUnit) unitEl.value = s.pageUnit;
}

// ── Import / Export ───────────────────────────────────────────────────────────

function bindImportExport() {
    var exportBtn  = document.getElementById("exportBtn");
    var importFile = document.getElementById("importFile");

    if (exportBtn) {
        exportBtn.addEventListener("click", function () {
            var blob = new Blob([JSON.stringify(books, null, 2)], { type: "application/json" });
            var a    = document.createElement("a");
            a.href   = URL.createObjectURL(blob);
            a.download = "bookvault-" + new Date().toISOString().slice(0, 10) + ".json";
            a.click();
            URL.revokeObjectURL(a.href);
            setStatus(document.getElementById("settingsStatus"), "Export complete.", "success");
        });
    }

    if (importFile) {
        importFile.addEventListener("change", function (e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    var data = JSON.parse(ev.target.result);
                    if (!Array.isArray(data)) throw new TypeError("Root must be an array.");
                    var valid = data.every(function (r) { return r.id && r.title && r.dateAdded; });
                    if (!valid) throw new TypeError("One or more records are missing required fields.");
                    save(data);
                    location.reload();
                } catch (err) {
                    setStatus(
                        document.getElementById("settingsStatus"),
                        "Import failed: " + err.message,
                        "error"
                    );
                }
            };
            reader.readAsText(file);
        });
    }
}

// ── Edit (exposed globally for inline event handlers in ui.js) ────────────────

window.editBook = function (id) {
    var item = State.books.find(function (b) { return b.id === id; });
    if (!item) return;

    document.getElementById("itemType").value = item.type || "book";
    applyTypeLayout(item.type || "book");

    document.getElementById("title").value       = item.title    || "";
    document.getElementById("author").value      = item.author   || "";
    document.getElementById("pages").value       = item.pages    || "";
    document.getElementById("tag").value         = item.tag      || "";
    document.getElementById("dateAdded").value   = item.dateAdded || "";
    document.getElementById("noteContent").value = item.noteContent || "";
    document.getElementById("coverFile").value   = "";

    var preview = document.getElementById("coverPreview");
    if (item.coverUrl) {
        preview.src = item.coverUrl;
        preview.classList.remove("hidden");
    } else {
        preview.classList.add("hidden");
    }

    document.getElementById("itemForm").dataset.editingId = id;
    document.getElementById("form-heading").textContent   = "Edit Item";
    document.querySelector("#itemForm button[type='submit']").textContent = "Update Item";

    navigateTo("add");
};

// ── Utilities ─────────────────────────────────────────────────────────────────

function readFileAsBase64(input) {
    return new Promise(function (resolve) {
        var file = input && input.files[0];
        if (!file) { resolve(""); return; }
        var reader = new FileReader();
        reader.onload  = function (e) { resolve(e.target.result); };
        reader.onerror = function ()  { resolve(""); };
        reader.readAsDataURL(file);
    });
}

function clearFieldErrors() {
    document.querySelectorAll(".field-error").forEach(function (el) {
        el.textContent = "";
    });
    document.querySelectorAll("[aria-invalid]").forEach(function (el) {
        el.removeAttribute("aria-invalid");
    });
}

function validateSingleField(id) {
    var el    = document.getElementById(id);
    var errEl = document.getElementById(id + "Err");
    if (!el || !errEl) return;

    if (el.required && !el.value.trim()) {
        var label = el.labels && el.labels[0]
            ? el.labels[0].textContent.replace("*", "").trim()
            : id;
        errEl.textContent = label + " is required.";
        el.setAttribute("aria-invalid", "true");
    } else {
        errEl.textContent = "";
        el.removeAttribute("aria-invalid");
    }
}

function setStatus(el, message, type) {
    if (!el) return;
    el.textContent  = message;
    el.style.color  = type === "error" ? "var(--danger)" : "var(--success)";
}