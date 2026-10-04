import { SIDES } from '../documents/combat.mjs';

const BaseTracker = foundry.applications.sidebar.tabs.CombatTracker;

/** Side-based tracker for Knave 2e. Header, footer, context menus and combatant controls stay the
 * core ones (so v13 and v14 keep their own labels); only the list of combatants is replaced. */
export default class Knave2eCombatTracker extends BaseTracker {
    static DEFAULT_OPTIONS = {
        classes: ['knave2e-combat'],
        actions: {
            rollSide: Knave2eCombatTracker.#onRollSide,
            swapSide: Knave2eCombatTracker.#onSwapSide,
            setLeader: Knave2eCombatTracker.#onSetLeader,
        },
    };

    static PARTS = {
        ...BaseTracker.PARTS,
        tracker: {
            template: 'systems/knave2e/templates/sidebar/combat-tracker.hbs',
            scrollable: [''],
        },
    };

    async _prepareTrackerContext(context, options) {
        await super._prepareTrackerContext(context, options);
        const combat = this.viewed;
        if (!combat) return;
        const initiative = combat.sideInitiative;
        const active = combat.activeSide;
        const turns = context.turns ?? [];
        context.isGM = game.user.isGM;
        context.started = combat.round > 0;
        context.rolled = SIDES.every(side => initiative[side] !== null);
        context.sides = SIDES.map(side => {
            const leader = combat.leaderOf(side);
            const members = turns
                .filter(t => combat.sideOf(combat.combatants.get(t.id)) === side)
                .map(t => ({ ...t, leader: t.id === leader?.id }));
            return {
                id: side,
                label: game.i18n.localize(`KNAVE2E.Combat.Side.${side}`),
                initiative: initiative[side],
                hasInitiative: initiative[side] !== null,
                active: active === side,
                waiting: context.started && active !== null && active !== side,
                members,
                empty: !members.length,
            };
        });
        // The side that won initiative is listed first.
        if (context.rolled) context.sides.sort((a, b) => b.initiative - a.initiative);
    }

    static async #onRollSide(event, target) {
        return this.viewed?.rollSides([target.dataset.side]);
    }

    static async #onSwapSide(event, target) {
        const combatant = this.#combatantFor(target);
        if (!combatant) return;
        const side = this.viewed.sideOf(combatant) === 'party' ? 'foes' : 'party';
        await combatant.update({ 'flags.knave2e.side': side, 'flags.knave2e.leader': false, initiative: null });
        await this.viewed.unsetFlag('knave2e', 'sideInitiative');
    }

    static async #onSetLeader(event, target) {
        const combatant = this.#combatantFor(target);
        const combat = this.viewed;
        if (!combatant || !combat) return;
        const side = combat.sideOf(combatant);
        const updates = combat.combatants
            .filter(c => combat.sideOf(c) === side)
            .map(c => ({ _id: c.id, 'flags.knave2e.leader': c.id === combatant.id }));
        await combat.updateEmbeddedDocuments('Combatant', updates);
    }

    #combatantFor(target) {
        const id = target.closest('[data-combatant-id]')?.dataset.combatantId;
        return this.viewed?.combatants.get(id);
    }
}
