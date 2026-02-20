import { books, deleteBook } from "./state.js";
import { compileRegex, highlight } from "./search.js";
import { calculateStats } from "./stats.js";

const PLACEHOLDER = "https://placehold.co/200x300/e0e4ea/6b7280?text=No+Cover";

// ── RECORDS ────────────────────────────────────────────
export function renderRecords() {
    const container = document.getElementById("recordsContainer");
    const input     = document.getElementById("searchInput").value;
    const caseSens  = document.getElementById("caseToggle").checked;
    const status    = document.getElementById("searchStatus");
    const sortField = document.getElementById("sortField").value;
    const sortDir   = document.getElementById("sortDir").textContent === "↑" ? 1 : -1;

    const regex = compileRegex(input, caseSens ? '' : 'i');
    container.innerHTML = "";

    let filtered = books.filter(item => {
        if (!input.trim()) return true;
        if (!regex) return false;
        return regex.test(item.title) || regex.test(item.author || '') || regex.test(item.tag) || regex.test(item.noteContent || '');
    });

    filtered.sort((a, b) => {
        let av = a[sortField] ?? '', bv = b[sortField] ?? '';
        if (sortField === 'pages') { av = Number(av); bv = Number(bv); }
        return av < bv ? -sortDir : av > bv ? sortDir : 0;
    });

    status.textContent = input.trim() ? `${filtered.length} result(s) found.` : "";

    if (!filtered.length) {
        container.innerHTML = `<p class="empty-state">${input.trim() ? "No results found." : "No items yet. Add your first book or note!"}</p>`;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        const cover = item.coverUrl || PLACEHOLDER;
        const isNote = item.type === 'note';

        card.innerHTML = `
            <div class="card-cover ${isNote ? 'note-cover' : ''}">
                ${isNote
                    ? `<span class="note-icon" aria-hidden="true">📝</span>`
                    : `<img src="${cover}" alt="Cover of ${item.title}" onerror="this.src='${PLACEHOLDER}'" />`
                }
            </div>
            <div class="card-body">
                <div class="card-type-badge ${isNote ? 'badge-note' : 'badge-book'}">${isNote ? 'Note' : 'Book'}</div>
                <h3>${highlight(item.title, regex)}</h3>
                ${!isNote ? `<p><strong>Author:</strong> ${highlight(item.author || '', regex)}</p>
                             <p><strong>Pages:</strong> ${item.pages} ${window._pageUnit || 'pages'}</p>` : ''}
                ${isNote && item.noteContent ? `<p class="note-excerpt">${highlight(item.noteContent.slice(0,80), regex)}${item.noteContent.length > 80 ? '…' : ''}</p>` : ''}
                <p><strong>Tag:</strong> ${highlight(item.tag, regex)}</p>
                <p><strong>Date:</strong> ${item.dateAdded}</p>
                <div class="card-actions">
                    <button class="btn-edit" aria-label="Edit ${item.title}">Edit</button>
                    <button class="btn-delete" aria-label="Delete ${item.title}">Delete</button>
                </div>
            </div>
        `;

        card.querySelector(".btn-edit").onclick = () => window.editBook(item.id);
        card.querySelector(".btn-delete").onclick = () => {
            if (confirm(`Delete "${item.title}"?`)) {
                deleteBook(item.id);
                renderRecords();
                renderDashboard();
            }
        };

        container.appendChild(card);
    });
}

// ── DASHBOARD ──────────────────────────────────────────
export function renderDashboard() {
    const dash     = document.getElementById("dashContent");
    const query    = document.getElementById("dashSearch").value;
    const caseSens = document.getElementById("dashCaseToggle").checked;
    const regex    = compileRegex(query, caseSens ? '' : 'i');

    const displayed = query.trim()
        ? books.filter(b => regex && (
            regex.test(b.title) ||
            regex.test(b.author || '') ||
            regex.test(b.tag) ||
            regex.test(b.noteContent || '')
          ))
        : books;

    dash.innerHTML = `
        <div class="dash-hero">
            <div class="dash-hero-text">
                <h2 id="dash-heading">Your Vault</h2>
                <p>Track your books and notes in one place.</p>
            </div>
            <button class="dash-add-btn" onclick="document.querySelector('[data-view=add]').click()">+ Add Item</button>
        </div>

        ${displayed.length === 0 ? `
            <div class="dash-empty">
                <div class="dash-empty-icon" aria-hidden="true">${query ? '🔍' : '📚'}</div>
                <h3>${query.trim() ? 'No results found' : 'Your vault is empty'}</h3>
                <p>${query.trim() ? 'Try a different search term.' : 'Start by adding your first book or note.'}</p>
                ${!query.trim() ? `<button class="dash-add-btn" style="margin:0 auto" onclick="document.querySelector('[data-view=add]').click()">+ Add Item</button>` : ''}
            </div>
        ` : `
            <div class="dash-book-grid" role="list">
                ${displayed.map(item => {
                    const isNote = item.type === 'note';
                    const cover = item.coverUrl || PLACEHOLDER;
                    return `
                    <div class="dash-book-card" role="listitem">
                        <div class="dash-book-cover ${isNote ? 'note-cover' : ''}">
                            ${isNote
                                ? `<span class="note-icon-lg" aria-hidden="true">📝</span>`
                                : `<img src="${cover}" alt="Cover of ${item.title}" onerror="this.src='${PLACEHOLDER}'" />`
                            }
                            <!-- Dots menu button -->
                            <button class="dots-btn" aria-label="Options for ${item.title}" onclick="window.toggleDots(event, '${item.id}')">⋯</button>
                            <!-- Dropdown -->
                            <div class="dots-menu" id="dots-${item.id}">
                                <button onclick="window.editBook('${item.id}')">✎ Edit</button>
                                <button class="dots-delete" onclick="window.dashDelete('${item.id}')">✕ Delete</button>
                            </div>
                        </div>
                        <div class="dash-book-info">
                            <p class="dash-book-title">${highlight(item.title, regex)}</p>
                            <p class="dash-book-author">${isNote ? '📝 Note' : (item.author || '')}</p>
                            <span class="tag">${item.tag}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `}
    `;

    // Close any open menu when clicking outside
    document.addEventListener('click', closeDots);

    window.toggleDots = (e, id) => {
        e.stopPropagation();
        // Close all others first
        document.querySelectorAll('.dots-menu.open').forEach(m => {
            if (m.id !== 'dots-' + id) m.classList.remove('open');
        });
        document.getElementById('dots-' + id)?.classList.toggle('open');
    };

    window.dashDelete = (id) => {
        const item = books.find(b => b.id === id);
        closeDots();
        if (confirm(`Delete "${item?.title}"?`)) {
            deleteBook(id);
            renderDashboard();
            renderRecords();
        }
    };
}

function closeDots() {
    document.querySelectorAll('.dots-menu.open').forEach(m => m.classList.remove('open'));
}