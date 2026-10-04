/** Knave 2e combat (Knave 2e Pages, p. 20): rounds last 10 seconds and each *side* acts as a unit.
 * Initiative is one CHA vs CHA check between the sides' leaders, and every creature of the winning
 * side moves and acts before the other side does. Only stable Combat APIs are used (v13 and v14). */
export const SIDES = ['party', 'foes'];

export default class Knave2eCombat extends Combat {
    /** Which side a combatant fights for. A manual flag wins; otherwise friendly/player tokens form the party. */
    static sideOf(combatant) {
        const flagged = combatant?.getFlag?.('knave2e', 'side');
        if (SIDES.includes(flagged)) return flagged;
        const friendly = combatant?.token?.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY;
        return friendly || combatant?.hasPlayerOwner ? 'party' : 'foes';
    }

    sideOf(combatant) {
        return this.constructor.sideOf(combatant);
    }

    /** Rolled initiative of each side, `null` until rolled. */
    get sideInitiative() {
        const stored = this.getFlag('knave2e', 'sideInitiative') ?? {};
        return { party: stored.party ?? null, foes: stored.foes ?? null };
    }

    /** The side currently acting, or `null` before combat starts or while initiative is unrolled. */
    get activeSide() {
        return this.round > 0 && this.combatant ? this.sideOf(this.combatant) : null;
    }

    /** The designated leader of a side, defaulting to its most charismatic living member. */
    leaderOf(side) {
        const members = this.combatants.filter(c => this.sideOf(c) === side);
        const flagged = members.find(c => c.getFlag('knave2e', 'leader'));
        if (flagged) return flagged;
        const score = c => c.actor?.system?.initiative ?? 0;
        const alive = members.filter(c => !c.isDefeated);
        return (alive.length ? alive : members).sort((a, b) => score(b) - score(a))[0] ?? null;
    }

    // Core hands this to Array#sort unbound, so it cannot rely on `this`.
    _sortCombatants(a, b) {
        const ia = Number.isFinite(a.initiative) ? a.initiative : -Infinity;
        const ib = Number.isFinite(b.initiative) ? b.initiative : -Infinity;
        if (ia !== ib) return ib - ia;
        const sa = SIDES.indexOf(Knave2eCombat.sideOf(a));
        const sb = SIDES.indexOf(Knave2eCombat.sideOf(b));
        if (sa !== sb) return sa - sb;
        return (a.name ?? '').localeCompare(b.name ?? '');
    }

    /** Roll the leader check for each side (or only the given ones) and share the result with its members. */
    async rollSides(sides = SIDES) {
        if (!game.user.isGM) {
            ui.notifications.warn(game.i18n.localize('KNAVE2E.Combat.GMOnly'));
            return this;
        }
        const stored = this.sideInitiative;
        const results = {};
        for (const side of sides) {
            const leader = this.leaderOf(side);
            if (!leader) continue;
            const modifier = leader.actor?.system?.initiative ?? 0;
            const roll = await new Roll('1d20 + @mod', { mod: modifier }).evaluate();
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ token: leader.token, actor: leader.actor }),
                flavor: game.i18n.format('KNAVE2E.Combat.SideRollFlavor', {
                    side: game.i18n.localize(`KNAVE2E.Combat.Side.${side}`),
                    leader: leader.name,
                }),
            });
            results[side] = roll.total;
        }
        const merged = { ...stored, ...results };
        // A tie between the two sides is re-rolled by the GM (the book allows only one side to act first).
        if (merged.party !== null && merged.party === merged.foes) {
            ui.notifications.info(game.i18n.localize('KNAVE2E.Combat.Tie'));
            return this.rollSides();
        }
        const updates = this.combatants.map(c => {
            const total = merged[this.sideOf(c)];
            return { _id: c.id, initiative: total ?? null };
        });
        await this.setFlag('knave2e', 'sideInitiative', merged);
        await this.updateEmbeddedDocuments('Combatant', updates);
        return this;
    }

    /** Rolling any combatant's initiative rolls the check of the side it belongs to. */
    async rollInitiative(ids) {
        ids = typeof ids === 'string' ? [ids] : ids;
        const sides = new Set(ids.map(id => this.sideOf(this.combatants.get(id))));
        return this.rollSides([...sides]);
    }

    async rollAll() {
        return this.rollSides();
    }

    async rollNPC() {
        return this.rollSides(['foes']);
    }

    async resetAll(options) {
        await this.unsetFlag('knave2e', 'sideInitiative');
        return super.resetAll(options);
    }

    /** First turn index of each contiguous run of the same side. */
    #blocks() {
        const blocks = [];
        this.turns.forEach((c, i) => {
            const side = this.sideOf(c);
            if (!blocks.length || blocks.at(-1).side !== side) blocks.push({ side, start: i });
        });
        return blocks;
    }

    async #moveTo(turn, direction) {
        const delta = this.getTimeDelta(this.round, this.turn, this.round, turn);
        const updateData = { round: this.round, turn };
        const updateOptions = { direction, worldTime: { delta } };
        Hooks.callAll('combatTurn', this, updateData, updateOptions);
        await this.update(updateData, updateOptions);
        return this;
    }

    /** A "turn" is a whole side's turn: skip to the first member of the next side, or start a new round. */
    async nextTurn() {
        if (this.round === 0 || this.turn === null) return super.nextTurn();
        const blocks = this.#blocks();
        const next = blocks.find(b => b.start > this.turn);
        return next ? this.#moveTo(next.start, 1) : this.nextRound();
    }

    async previousTurn() {
        if (this.round === 0 || this.turn === null) return super.previousTurn();
        const blocks = this.#blocks();
        const current = blocks.findLast(b => b.start <= this.turn);
        const previous = blocks[blocks.indexOf(current) - 1];
        return previous ? this.#moveTo(previous.start, -1) : this.previousRound();
    }
}
