/** Roles a monster or recruit can be tagged with when it travels with the party. */
export const PARTY_ROLES = ['hireling', 'mercenary', 'companion'];

/** Groups an actor can belong to. */
export const PARTY_GROUPS = ['players', 'hireling', 'mercenary', 'expert', 'companion', 'vehicles', 'buildings', 'armies', 'creatures'];

const RECRUIT_CATEGORY_GROUPS = ['hireling', 'mercenary', 'expert'];

/** Actor types that carry an inventory worth pooling in the shared stash. */
export const INVENTORY_HOLDER_TYPES = ['character', 'recruit', 'vehicle', 'building'];

/** Holders whose slot limit has no rule behind it, so the GM sets it by hand. */
export const MANUAL_LIMIT_TYPES = ['vehicle', 'building'];

/** Which group an actor belongs to; `null` for actors that cannot join a party. */
export function groupOf(actor) {
    switch (actor?.type) {
        case 'character':
            return 'players';
        case 'vehicle':
            return 'vehicles';
        case 'building':
            return 'buildings';
        case 'army':
            return 'armies';
        case 'recruit': {
            const tagged = actor.system.partyRole;
            if (PARTY_ROLES.includes(tagged)) return tagged;
            return RECRUIT_CATEGORY_GROUPS.includes(actor.system.category) ? actor.system.category : 'hireling';
        }
        case 'monster':
            return PARTY_ROLES.includes(actor.system.partyRole) ? actor.system.partyRole : 'creatures';
        default:
            return null;
    }
}

/** The role tag shown on a sheet: only followers (recruits and tagged monsters) have one. */
export function roleTagOf(actor) {
    const group = groupOf(actor);
    return ['hireling', 'mercenary', 'expert', 'companion'].includes(group) ? group : null;
}

/** Tabs of the party sheet. Every tab but the roster only exists while the party nests a matching actor. */
export const PARTY_TABS = [
    { id: 'roster', icon: 'fa-folder-tree', always: true },
    { id: 'characters', icon: 'fa-user', test: (members) => members.some((m) => m.group === 'players') },
    { id: 'inventory', icon: 'fa-box-open', test: (members) => members.some((m) => INVENTORY_HOLDER_TYPES.includes(m.actor.type)) },
    {
        id: 'retinue',
        icon: 'fa-people-group',
        test: (members) => members.some((m) => ['hireling', 'mercenary', 'expert', 'companion'].includes(m.group)),
    },
    { id: 'holdings', icon: 'fa-chess-rook', test: (members) => members.some((m) => ['vehicles', 'buildings'].includes(m.group)) },
    { id: 'armies', icon: 'fa-flag', test: (members) => members.some((m) => m.group === 'armies') },
];

/** Resolve a party's stored members into live world actors; `missing` are entries whose actor is gone. */
export function resolveMembers(party) {
    const members = [];
    const missing = [];
    for (const entry of party.system.members) {
        let actor = null;
        try {
            const doc = fromUuidSync(entry.uuid);
            actor = doc?.documentName === 'Actor' ? doc : null;
        } catch {
            actor = null;
        }
        const group = groupOf(actor);
        if (!actor || !group) missing.push(entry);
        else members.push({ entry, uuid: entry.uuid, folder: entry.folder, actor, group });
    }
    return { members, missing };
}

const refreshDirectory = foundry.utils.debounce(() => ui.actors?.render(), 150);

/** Members are separate documents, so an open party sheet must refresh when one of them changes. */
export function refreshPartiesOf(actor) {
    if (!actor?.uuid) return;
    const parties = game.actors.filter((a) => a.type === 'party');
    // The Actors directory lists each party's members, so it must follow the party and its members.
    if (actor.type === 'party' || parties.some((p) => p.system.members.some((m) => m.uuid === actor.uuid))) refreshDirectory();
    for (const party of parties) {
        if (!party.sheet?.rendered || !party.system.members.some((m) => m.uuid === actor.uuid)) continue;
        // Deriving slots updates items, so several hooks can fire at once: coalesce them into one render.
        party._knave2eRefresh ??= foundry.utils.debounce(() => party.sheet?.render(false), 120);
        party._knave2eRefresh();
    }
}

/** Add a world actor to a party (optionally into a subfolder), or move it if it is already a member. */
export async function enlistActor(party, uuid, folder = '') {
    const warn = (key) => ui.notifications.warn(game.i18n.localize(key));
    if (!party.isOwner) return warn('KNAVE2E.Party.NotOwner');
    let actor = await fromUuid(uuid);
    if (actor?.documentName === 'Token') actor = actor.actor;
    if (actor?.isToken) actor = actor.baseActor;
    if (!actor || actor.documentName !== 'Actor') return;
    if (actor.pack) return warn('KNAVE2E.Party.WorldOnly');
    if (actor.id === party.id || !groupOf(actor)) return warn('KNAVE2E.Party.CannotJoin');
    const members = party.system.members;
    const target = party.system.folders.some((f) => f.id === folder) ? folder : '';
    const existing = members.find((m) => m.uuid === actor.uuid);
    if (existing) {
        // Dropping a member onto a folder moves it there.
        if (existing.folder === target) return warn('KNAVE2E.Party.AlreadyMember');
        return party.update({ 'system.members': members.map((m) => (m.uuid === actor.uuid ? { ...m, folder: target } : m)) });
    }
    return party.update({ 'system.members': [...members, { uuid: actor.uuid, folder: target }] });
}

/** Items and effects change what the party sheet shows about their owner. */
export function refreshPartiesOfParent(document) {
    const parent = document?.parent;
    if (parent?.documentName === 'Actor') refreshPartiesOf(parent);
}
