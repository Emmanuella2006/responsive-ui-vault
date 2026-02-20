import { addBook, updateBook, books } from "./state.js";
import { validateItem } from "./validators.js";
import { renderRecords, renderDashboard } from "./ui.js";
import { loadSettings, saveSettings, save } from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {

    applySettings();
    renderDashboard();
    renderRecords();

    // ── Nav ──
    document.querySelectorAll("nav button").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
            document.getElementById(btn.dataset.view).classList.remove("hidden");
            document.querySelectorAll("nav button").forEach(b => {
                b.classList.remove("active");
                b.removeAttribute("aria-current");
            });
            btn.classList.add("active");
            btn.setAttribute("aria-current", "page");
        };
    });
    const dashBtn = document.querySelector("[data-view='dashboard']");
    dashBtn.classList.add("active");
    dashBtn.setAttribute("aria-current", "page");

    // ── Dashboard search ──
    document.getElementById("dashSearch").oninput = () => renderDashboard();
    document.getElementById("dashCaseToggle").onchange = () => renderDashboard();

    // ── Records search & sort ──
    document.getElementById("searchInput").oninput = () => renderRecords();
    document.getElementById("caseToggle").onchange = () => renderRecords();

    let sortAsc = true;
    document.getElementById("sortDir").onclick = () => {
        sortAsc = !sortAsc;
        document.getElementById("sortDir").textContent = sortAsc ? "↑" : "↓";
        renderRecords();
    };
    document.getElementById("sortField").onchange = () => renderRecords();

    // ── Form: inline validation ──
    const fields = ["title", "author", "pages", "tag", "dateAdded"];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("blur", () => validateField(id));
    });

    document.getElementById("itemForm").onsubmit = async e => {
        e.preventDefault();
        const editingId = document.getElementById("itemForm").dataset.editingId;
        const existingItem = editingId ? books.find(b => b.id === editingId) : null;
        const type = document.getElementById("itemType").value;

        const coverBase64 = await getBase64(document.getElementById("coverFile"))
            || (existingItem ? existingItem.coverUrl : "");

        const item = {
            id: editingId || "item_" + Date.now(),
            type,
            title: document.getElementById("title").value.trim(),
            author: type === 'book' ? document.getElementById("author").value.trim() : "",
            pages: type === 'book' ? Number(document.getElementById("pages").value) : 0,
            tag: document.getElementById("tag").value.trim(),
            dateAdded: document.getElementById("dateAdded").value,
            noteContent: type === 'note' ? document.getElementById("noteContent").value.trim() : "",
            coverUrl: coverBase64,
            createdAt: existingItem ? existingItem.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const errors = validateItem(item);
        const status = document.getElementById("formStatus");

        // Show inline errors
        clearFieldErrors();
        if (Object.keys(errors).length) {
            Object.entries(errors).forEach(([field, msg]) => {
                const errEl = document.getElementById(field + "Err") || document.getElementById("dateErr");
                if (errEl) errEl.textContent = msg;
                const input = document.getElementById(field === 'date' ? 'dateAdded' : field);
                if (input) input.setAttribute("aria-invalid", "true");
            });
            status.textContent = "Please fix the errors above.";
            status.style.color = "var(--danger)";
            return;
        }

        if (editingId) {
            updateBook(item);
            status.textContent = "Item updated!";
            delete document.getElementById("itemForm").dataset.editingId;
            document.querySelector("#add h2").textContent = "Add Item";
            document.querySelector("#itemForm button[type='submit']").textContent = "Save Item";
        } else {
            addBook(item);
            status.textContent = "Item saved!";
        }

        status.style.color = "var(--success)";
        e.target.reset();
        document.getElementById("coverPreview").classList.add("hidden");
        clearFieldErrors();
        renderRecords();
        renderDashboard();
    };

    // ── Settings ──
    const pageCap = document.getElementById("pageCap");
    const settings = loadSettings();
    if (settings.pageCap) pageCap.value = settings.pageCap;
    if (settings.pageUnit) document.getElementById("pageUnit").value = settings.pageUnit;
    document.getElementById("settingsStatus").textContent = "";

    pageCap.onchange = saveCurrentSettings;
    document.getElementById("pageUnit").onchange = saveCurrentSettings;

    function saveCurrentSettings() {
        saveSettings({
            pageCap: Number(pageCap.value),
            pageUnit: document.getElementById("pageUnit").value
        });
        window._pageCap = Number(pageCap.value);
        window._pageUnit = document.getElementById("pageUnit").value;
        document.getElementById("settingsStatus").textContent = "Settings saved.";
        renderDashboard();
    }

    // ── Export ──
    document.getElementById("exportBtn").onclick = () => {
        const blob = new Blob([JSON.stringify(books, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `bookvault-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        document.getElementById("settingsStatus").textContent = "Exported successfully!";
    };

    // ── Import ──
    document.getElementById("importFile").onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!Array.isArray(data)) throw new Error("Not an array");
                // Validate structure
                const valid = data.every(r => r.id && r.title && r.dateAdded);
                if (!valid) throw new Error("Invalid records");
                save(data);
                location.reload();
            } catch (err) {
                const s = document.getElementById("settingsStatus");
                s.textContent = "Invalid file: " + err.message;
                s.style.color = "var(--danger)";
            }
        };
        reader.readAsText(file);
    };
});

// ── Edit (called from ui.js) ──
window.editBook = (id) => {
    const item = books.find(b => b.id === id);
    if (!item) return;

    document.getElementById("itemType").value = item.type || 'book';
    document.getElementById("itemType").dispatchEvent(new Event('change'));
    document.getElementById("title").value = item.title;
    document.getElementById("author").value = item.author || '';
    document.getElementById("pages").value = item.pages || '';
    document.getElementById("tag").value = item.tag;
    document.getElementById("dateAdded").value = item.dateAdded;
    document.getElementById("noteContent").value = item.noteContent || '';
    document.getElementById("coverFile").value = "";

    const preview = document.getElementById("coverPreview");
    if (item.coverUrl) { preview.src = item.coverUrl; preview.classList.remove("hidden"); }
    else { preview.classList.add("hidden"); }

    document.getElementById("itemForm").dataset.editingId = id;
    document.querySelector("#add h2").textContent = "Edit Item";
    document.querySelector("#itemForm button[type='submit']").textContent = "Update Item";

    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
    document.getElementById("add").classList.remove("hidden");
    document.querySelectorAll("nav button").forEach(b => { b.classList.remove("active"); b.removeAttribute("aria-current"); });
    const addBtn = document.querySelector("[data-view='add']");
    addBtn.classList.add("active");
    addBtn.setAttribute("aria-current", "page");
};

// ── Helpers ──
function getBase64(input) {
    return new Promise(resolve => {
        const file = input.files[0];
        if (!file) resolve("");
        else { const r = new FileReader(); r.onload = e => resolve(e.target.result); r.readAsDataURL(file); }
    });
}

function clearFieldErrors() {
    document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
    document.querySelectorAll("[aria-invalid]").forEach(el => el.removeAttribute("aria-invalid"));
}

function validateField(id) {
    // real-time single field feedback on blur
    const el = document.getElementById(id);
    if (!el) return;
    const errEl = document.getElementById(id + "Err");
    if (!errEl) return;
    if (el.required && !el.value.trim()) {
        errEl.textContent = `${el.labels?.[0]?.textContent?.replace('*','').trim() || id} is required.`;
        el.setAttribute("aria-invalid", "true");
    } else {
        errEl.textContent = "";
        el.removeAttribute("aria-invalid");
    }
}

function applySettings() {
    const settings = loadSettings();
    if (settings.pageCap) window._pageCap = settings.pageCap;
    if (settings.pageUnit) window._pageUnit = settings.pageUnit;
}