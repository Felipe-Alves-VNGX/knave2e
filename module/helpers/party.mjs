/** Roles a monster or recruit can be tagged with when it travels with the party. */
export const PARTY_ROLES = ['hireling', 'mercenary', 'companion'];

/** Roster sections, in display order. */
export const PARTY_GROUPS = [
    { id: 'players', label: 'KNAVE2E.Party.Group.players', icon: 'fa-user' },
    { id: 'hireling', label: 'KNAVE2E.Party.Group.hireling', icon: 'fa-hand-holding-dollar' },
    { id: 'mercenary', label: 'KNAVE2E.Party.Group.mercenary', icon: 'fa-shield-halved' },
    { id: 'expert', label: 'KNAVE2E.Party.Group.expert', icon: 'fa-hammer' },
    { id: 'companion', label: 'KNAVE2E.Party.Group.companion', icon: 'fa-paw' },
    { id: 'vehicles', label: 'KNAVE2E.Party.Group.vehicles', icon: 'fa-wagon-covered' },
    { id: 'buildings', label: 'KNAVE2E.Party.Group.buildings', icon: 'fa-chess-rook' },
    { id: 'creatures', label: 'KNAVE2E.Party.Group.creatures', icon: 'fa-dragon' },
];

const RECRUIT_CATEGORY_GROUPS = ['hireling', 'mercenary', 'expert'];

/** Which roster section an actor belongs to; `null` for actors that cannot join a party. */
export function groupOf(actor) {
    switch (actor?.type) {
        case 'character':
            return 'players';
        case 'vehicle':
            return 'vehicles';
        case 'building':
            return 'buildings';
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

/** Members are separate documents, so an open party sheet must be refreshed when one of them changes. */
export function refreshPartiesOf(actor) {
    if (!actor?.uuid) return;
    for (const party of game.actors.filter((a) => a.type === 'party')) {
        if (party.sheet?.rendered && party.system.members.includes(actor.uuid)) party.sheet.render(false);
    }
}

/** The role tag shown on a sheet: only followers (recruits and tagged monsters) have one. */
export function roleTagOf(actor) {
    const group = groupOf(actor);
    return ['hireling', 'mercenary', 'expert', 'companion'].includes(group) ? group : null;
}
