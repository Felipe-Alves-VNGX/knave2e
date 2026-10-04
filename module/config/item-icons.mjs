// Default artwork for new items. Icons: game-icons.net (CC BY 3.0), see assets/icons/CREDITS.md.
const DIR = 'systems/knave2e/assets/icons/items';

// A category icon wins over the icon of the item's type.
const BY_CATEGORY = {
    melee: 'broadsword',
    ranged: 'bow-arrow',
    shield: 'bordered-shield',
    helmet: 'visored-helm',
    gambeson: 'leather-armor',
    mailShirt: 'chain-mail',
    breastplate: 'breastplate',
    armPlate: 'bracers',
    legPlate: 'greaves',
    candle: 'candle-flame',
    torch: 'torch',
    lantern: 'lantern-flame',
    chaosSpellbook: 'magic-swirl',
};

const BY_TYPE = {
    weapon: 'broadsword',
    armor: 'bordered-shield',
    equipment: 'backpack',
    lightSource: 'torch',
    spellbook: 'spell-book',
    potion: 'potion-ball',
    monsterAttack: 'claw-slashes',
};

/** Path of the default icon for an item of this type (and category, when known), or `null`. */
export function defaultItemIcon(type, category) {
    const name = BY_CATEGORY[category] ?? BY_TYPE[type];
    return name ? `${DIR}/${name}.svg` : null;
}
