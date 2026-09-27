/** Shared natural page height is handled by overlapping CSS grid cells.
 * Inventory leaves keep live item rows in place so Foundry handlers/dragging survive. */
export function installDocumentPages(root, state = { category: 'all', page: 0 }) {
    const form = root.matches?.('.document-character') ? root : root.querySelector('.document-character');
    if (!form) return () => {};
    const inventory = form.querySelector('.tab.items');
    const rows = [...inventory.querySelectorAll('.items-list > [data-item-id]')];
    const filters = [...inventory.querySelectorAll('[data-inventory-filter]')];
    const previous = inventory.querySelector('[data-inventory-page="previous"]');
    const next = inventory.querySelector('[data-inventory-page="next"]');
    const status = inventory.querySelector('.inventory-page-status');
    const empty = inventory.querySelector('.inventory-empty');
    const pageSize = 6;
    inventory.style.setProperty('--inventory-reserved-rows', Math.min(pageSize, rows.length));
    function category(row) {
        if (['weapon', 'armor'].includes(row.dataset.itemType)) return 'arms';
        if (['spellbook', 'potion'].includes(row.dataset.itemType)) return 'magic';
        return 'gear';
    }
    function render() {
        if (!filters.some(button => button.dataset.inventoryFilter === state.category)) state.category = 'all';
        const selected = rows.filter(row => state.category === 'all' || category(row) === state.category);
        const pages = Math.max(1, Math.ceil(selected.length / pageSize));
        state.page = Math.max(0, Math.min(state.page, pages - 1));
        const visible = new Set(selected.slice(state.page * pageSize, (state.page + 1) * pageSize));
        rows.forEach(row => row.classList.toggle('inventory-hidden', !visible.has(row)));
        filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.inventoryFilter === state.category)));
        previous.disabled = state.page === 0;
        next.disabled = state.page === pages - 1;
        status.textContent = `${state.page + 1} / ${pages}`;
        empty.hidden = selected.length !== 0;
    }
    function onClick(event) {
        const filter = event.target.closest('[data-inventory-filter]');
        const page = event.target.closest('[data-inventory-page]');
        if (filter && inventory.contains(filter)) { state.category = filter.dataset.inventoryFilter; state.page = 0; render(); }
        else if (page && inventory.contains(page) && !page.disabled) { state.page += page.dataset.inventoryPage === 'next' ? 1 : -1; render(); }
    }
    let lastWidth = -1;
    function resize() {
        const width = form.getBoundingClientRect().width;
        if (width > 0 && width !== lastWidth) {
            lastWidth = width;
            // A5 is a minimum proportion, never a cap on the tallest page.
            form.style.setProperty('--journal-min-height', `${Math.ceil(width * 210 / 148)}px`);
        }
    }
    render(); resize();
    const observer = new ResizeObserver(resize);
    observer.observe(form);
    inventory.addEventListener('click', onClick);
    return () => { observer.disconnect(); inventory.removeEventListener('click', onClick); };
}
