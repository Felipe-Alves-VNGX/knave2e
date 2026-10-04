import { enlistActor, resolveMembers } from '../helpers/party.mjs';

const OPEN_KEY = 'knave2e.partyNestOpen';

function openSet() {
    try {
        return new Set(JSON.parse(localStorage.getItem(OPEN_KEY) ?? '[]'));
    } catch {
        return new Set();
    }
}

function saveOpen(set) {
    try {
        localStorage.setItem(OPEN_KEY, JSON.stringify([...set]));
    } catch {
        // Remembering which parties are expanded is a convenience only.
    }
}

function memberItem(actor, uuid) {
    const li = document.createElement('li');
    li.className = 'nest-member';
    li.dataset.uuid = uuid;
    li.draggable = true;
    const img = document.createElement('img');
    img.src = actor.img;
    img.alt = '';
    const name = document.createElement('a');
    name.textContent = actor.name;
    li.append(img, name);
    name.addEventListener('click', () => {
        if (actor.testUserPermission(game.user, 'OBSERVER')) actor.sheet.render(true);
    });
    li.addEventListener('dragstart', (event) => {
        event.stopPropagation();
        event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'Actor', uuid }));
    });
    return li;
}

/** Show each party in the Actors directory as an expandable folder that lists its members, and let
 * actors be dropped straight onto it. Works on the markup shared by Foundry v13 and v14. */
export function decorateActorDirectory(app, html) {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;
    const open = openSet();
    for (const entry of root.querySelectorAll('li.directory-item[data-entry-id]')) {
        const party = game.actors.get(entry.dataset.entryId);
        if (party?.type !== 'party') continue;

        const { members, missing } = resolveMembers(party);
        entry.classList.add('party-entry');
        const expanded = open.has(party.id);
        entry.classList.toggle('expanded', expanded);

        const toggle = document.createElement('a');
        toggle.className = 'party-nest-toggle fa-solid fa-caret-right';
        toggle.title = game.i18n.localize('KNAVE2E.Party.ToggleFolder');
        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const now = openSet();
            now.has(party.id) ? now.delete(party.id) : now.add(party.id);
            saveOpen(now);
            entry.classList.toggle('expanded', now.has(party.id));
        });
        entry.prepend(toggle);

        const count = document.createElement('span');
        count.className = 'party-nest-count';
        count.textContent = String(members.length + missing.length);
        entry.querySelector('.entry-name')?.after(count);

        const nest = document.createElement('ol');
        nest.className = 'party-nest plain';
        const byFolder = (id) => members.filter((m) => m.folder === id);
        for (const m of byFolder('')) nest.append(memberItem(m.actor, m.uuid));
        for (const folder of party.system.folders) {
            const head = document.createElement('li');
            head.className = 'nest-folder';
            head.textContent = folder.name;
            nest.append(head);
            for (const m of byFolder(folder.id)) nest.append(memberItem(m.actor, m.uuid));
        }
        entry.append(nest);

        // Dropping an actor on the party enlists it; stop the directory from filing it elsewhere.
        entry.addEventListener('dragover', (event) => {
            event.preventDefault();
            entry.classList.add('drop-target');
        });
        entry.addEventListener('dragleave', () => entry.classList.remove('drop-target'));
        entry.addEventListener('drop', async (event) => {
            entry.classList.remove('drop-target');
            const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
            if (data?.type !== 'Actor') return;
            event.preventDefault();
            event.stopPropagation();
            await enlistActor(party, data.uuid);
        });
    }
}
