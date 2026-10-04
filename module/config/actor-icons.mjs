// Default portrait for new actors, one per type. Icons: game-icons.net (CC BY 3.0), see assets/icons/CREDITS.md.
const DIR = 'systems/knave2e/assets/icons/actors';
const TYPES = ['character', 'recruit', 'monster', 'vehicle', 'building', 'party', 'army'];

/** Path of the default portrait for an actor type, or `null` for types that have none. */
export function defaultActorIcon(type) {
    return TYPES.includes(type) ? `${DIR}/${type}.svg` : null;
}
