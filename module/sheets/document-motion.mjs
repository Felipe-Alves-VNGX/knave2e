/** Decorative page turn around the existing Foundry tab controller.
 * The live document remains the only form. Snapshots are inert and nameless;
 * this helper never submits, updates, hides or re-parents live fields. */
export function installDocumentMotion(root) {
    const form = root.matches?.('.document-character') ? root : root.querySelector('.document-character');
    if (!form) return () => {};
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let overlay = null;
    let animation = null;
    let frame = null;
    let minHeight = null;
    let resizeObserver = null;

    function clear() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        if (animation) { animation.onfinish = null; animation.oncancel = null; animation.cancel(); }
        animation = null;
        overlay?.remove(); overlay = null;
        if (minHeight !== null) form.style.minHeight = minHeight;
        minHeight = null;
        resizeObserver?.disconnect(); resizeObserver = null;
    }

    function snapshot() {
        const copy = document.createElement('div');
        copy.className = form.className + ' document-turn-face';
        for (const child of form.children) {
            if (!child.matches('.document-turn-layer, .document-bookmarks')) copy.append(child.cloneNode(true));
        }
        copy.querySelectorAll('.document-bookmarks, .document-turn-layer').forEach(el => el.remove());
        // cloneNode does not reliably copy current values of every form control.
        const originals = [...form.querySelectorAll('input, textarea, select')];
        copy.querySelectorAll('input, textarea, select').forEach((el, i) => {
            if (originals[i]) { el.value = originals[i].value; if ('checked' in el) el.checked = originals[i].checked; }
        });
        for (const el of [copy, ...copy.querySelectorAll('*')]) {
            for (const attr of ['id', 'name', 'for', 'data-edit', 'contenteditable', 'autofocus']) el.removeAttribute(attr);
            if (el.matches('a, button, input, select, textarea, [tabindex]')) el.setAttribute('tabindex', '-1');
        }
        copy.inert = true;
        copy.setAttribute('aria-hidden', 'true');
        return copy;
    }

    function turn(event) {
        const tab = event.target.closest?.('.document-bookmarks [data-tab]');
        if (!tab || !form.contains(tab)) return;
        clear();
        const active = form.querySelector('.sheet-body > .tab.active');
        const destination = [...form.querySelectorAll('.sheet-body > .tab')].find(el => el.dataset.tab === tab.dataset.tab);
        if (!active || !destination || active === destination || reduced.matches || typeof form.animate !== 'function') return;
        const links = [...form.querySelectorAll('.document-bookmarks [data-tab]')];
        const previous = links.findIndex(el => el.dataset.tab === active.dataset.tab);
        const backwards = links.indexOf(tab) < previous;
        const rect = form.getBoundingClientRect();
        const outgoing = snapshot();
        // Wait for Foundry's normal tab controller to activate the destination.
        frame = requestAnimationFrame(() => {
            frame = null;
            if (!form.isConnected || !destination.classList.contains('active')) return;
            const targetRect = form.getBoundingClientRect();
            minHeight = form.style.minHeight;
            form.style.minHeight = `${Math.max(rect.height, targetRect.height)}px`;
            overlay = document.createElement('div');
            overlay.className = 'document-turn-layer';
            overlay.setAttribute('aria-hidden', 'true');
            overlay.inert = true;
            Object.assign(overlay.style, { width: `${rect.width}px`, height: `${rect.height}px` });
            // Going back brings the previous leaf onto the current page, around
            // the same left spine. Mirroring the hinge would open another book.
            const face = backwards ? snapshot() : outgoing;
            for (const leaf of backwards ? [outgoing, face] : [face]) {
                Object.assign(leaf.style, { width: `${rect.width}px`, height: `${rect.height}px`, minHeight: '0', transformOrigin: '0 50%' });
                overlay.append(leaf);
            }
            form.append(overlay);
            animation = face.animate([
                { transform: 'rotateY(0deg)', filter: 'brightness(1)', opacity: 1, offset: 0 },
                { transform: `rotateY(-32deg)`, filter: 'brightness(.9)', opacity: 1, offset: .4 },
                { transform: `rotateY(-83deg)`, filter: 'brightness(.72)', opacity: .9, offset: .86 },
                { transform: `rotateY(-100deg)`, filter: 'brightness(.72)', opacity: 0, offset: 1 },
            ], { duration: 480, easing: 'cubic-bezier(.3,.1,.25,1)', fill: 'both', direction: backwards ? 'reverse' : 'normal' });
            animation.onfinish = clear;
            animation.oncancel = clear;
            if (typeof ResizeObserver !== 'undefined') {
                resizeObserver = new ResizeObserver(() => {
                    if (Math.abs(form.getBoundingClientRect().width - rect.width) > 1) clear();
                });
                resizeObserver.observe(form);
            }
        });
    }
    const onMotionPreference = () => { if (reduced.matches) clear(); };
    form.addEventListener('click', turn, true);
    reduced.addEventListener('change', onMotionPreference);
    return () => {
        clear();
        form.removeEventListener('click', turn, true);
        reduced.removeEventListener('change', onMotionPreference);
    };
}
