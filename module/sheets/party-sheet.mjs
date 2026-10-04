import { PARTY_GROUPS, PARTY_ROLES, groupOf } from '../helpers/party.mjs';

/** Roster of the actors that travel together. Inspired by the Party actor of the Pathfinder 2e
 * system for Foundry VTT (https://github.com/foundryvtt/pf2e); the implementation is original. */
export default class Knave2ePartySheet extends foundry.appv1.sheets.ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['knave2e', 'sheet', 'actor', 'document-sheet'],
            width: 760,
            height: 820,
            dragDrop: [{ dragSelector: null, dropSelector: null }],
        });
    }

    get template() {
        return 'systems/knave2e/templates/actor/actor-party-sheet.hbs';
    }

    async getData() {
        const context = super.getData();
        context.appId = this.appId;
        const system = this.actor.toObject(false).system;
        context.system = system;
        context.partyRoles = {
            '': 'KNAVE2E.Party.RoleNone',
            ...Object.fromEntries(PARTY_ROLES.map(role => [role, `KNAVE2E.Party.Role.${role}`])),
        };

        const buckets = new Map(PARTY_GROUPS.map(group => [group.id, { ...group, members: [] }]));
        const missing = [];
        const totals = { members: 0, upkeep: 0, coins: 0, hp: 0, hpMax: 0 };
        for (const uuid of system.members) {
            const actor = this._resolve(uuid);
            const group = groupOf(actor);
            if (!actor || !group) {
                missing.push(uuid);
                continue;
            }
            const row = this._memberRow(actor, group);
            buckets.get(group).members.push(row);
            totals.members += 1;
            if (row.hidden) continue;
            if (['hireling', 'mercenary', 'expert'].includes(group)) totals.upkeep += actor.system.costPerMonth ?? 0;
            totals.coins += actor.system.coins ?? 0;
            if (actor.system.hitPoints) {
                totals.hp += actor.system.hitPoints.value;
                totals.hpMax += actor.system.hitPoints.max;
            }
        }
        context.groups = [...buckets.values()].filter(group => group.members.length);
        context.missing = missing;
        context.totals = totals;
        context.isEmpty = !totals.members && !missing.length;
        context.system.enrichedHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(system.description);
        return context;
    }

    _resolve(uuid) {
        try {
            const doc = fromUuidSync(uuid);
            return doc?.documentName === 'Actor' ? doc : null;
        } catch {
            return null;
        }
    }

    _memberRow(actor, group) {
        const system = actor.system;
        const visible = actor.testUserPermission(game.user, 'OBSERVER');
        const has = (value) => Number.isFinite(value);
        const stats = [];
        if (visible) {
            if (system.hitPoints) stats.push({ label: 'KNAVE2E.HitPoints', value: `${system.hitPoints.value}/${system.hitPoints.max}` });
            if (has(system.armorClass)) stats.push({ label: 'KNAVE2E.ArmorClass', value: system.armorClass });
            if (['recruit', 'monster'].includes(actor.type) && has(system.level)) stats.push({ label: 'KNAVE2E.Level', value: system.level });
            if (has(system.morale)) stats.push({ label: 'KNAVE2E.Morale', value: system.morale });
            if (actor.type === 'recruit' && has(system.costPerMonth)) stats.push({ label: 'KNAVE2E.CostPerMonth', value: `${system.costPerMonth}c` });
            if (actor.type === 'vehicle' && has(system.crew)) stats.push({ label: 'KNAVE2E.Crew', value: system.crew });
            if (actor.type === 'building' && has(system.squares)) stats.push({ label: 'KNAVE2E.Squares', value: system.squares });
        }
        
        return {
            uuid: actor.uuid,
            name: actor.name,
            img: actor.img,
            type: actor.type,
            group,
            canOpen: visible,
            retainer: ['recruit', 'monster'].includes(actor.type),
            role: system.partyRole ?? '',
            roleTag: ['hireling', 'mercenary', 'expert', 'companion'].includes(group) ? group : null,
            hidden: !visible,
            stats,
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.party-open').on('click', (event) => {
            const actor = this._resolve(event.currentTarget.closest('[data-uuid]').dataset.uuid);
            if (actor?.testUserPermission(game.user, 'OBSERVER')) actor.sheet.render(true);
        });

        if (!this.isEditable) return;

        html.find('.party-remove').on('click', (event) => {
            const uuid = event.currentTarget.closest('[data-uuid]').dataset.uuid;
            return this.actor.update({ 'system.members': this.actor.system.members.filter((m) => m !== uuid) });
        });

        html.find('.party-role-select').on('change', (event) => {
            const actor = this._resolve(event.currentTarget.closest('[data-uuid]').dataset.uuid);
            if (!actor?.isOwner) return ui.notifications.warn(game.i18n.localize('KNAVE2E.Party.NotOwner'));
            return actor.update({ 'system.partyRole': event.currentTarget.value });
        });
    }

    async _onDrop(event) {
        if (!this.isEditable) return;
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data?.type !== 'Actor') return;
        return this._enlist(data.uuid);
    }

    async _enlist(uuid) {
        let actor = await fromUuid(uuid);
        if (actor?.documentName === 'Token') actor = actor.actor;
        if (actor?.isToken) actor = actor.baseActor;
        const warn = (key) => ui.notifications.warn(game.i18n.localize(key));
        if (!actor || actor.documentName !== 'Actor') return;
        if (actor.pack) return warn('KNAVE2E.Party.WorldOnly');
        if (actor.id === this.actor.id || !groupOf(actor)) return warn('KNAVE2E.Party.CannotJoin');
        const members = this.actor.system.members;
        if (members.includes(actor.uuid)) return warn('KNAVE2E.Party.AlreadyMember');
        return this.actor.update({ 'system.members': [...members, actor.uuid] });
    }
}
