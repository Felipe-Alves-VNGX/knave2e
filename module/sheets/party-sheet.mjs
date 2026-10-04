import { INVENTORY_HOLDER_TYPES, MANUAL_LIMIT_TYPES, PARTY_ROLES, PARTY_TABS, enlistActor, resolveMembers, roleTagOf } from '../helpers/party.mjs';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const TYPE_ICONS = {
    character: 'fa-user',
    recruit: 'fa-hand-holding-dollar',
    monster: 'fa-dragon',
    vehicle: 'fa-wagon-covered',
    building: 'fa-chess-rook',
    army: 'fa-flag',
};
const RETINUE_GROUPS = ['hireling', 'mercenary', 'expert', 'companion'];

/** A folder-like actor: nest other actors in it (and in its subfolders) and manage them from tabs that
 * only exist while the party holds a matching actor. Inspired by the Party actor of the Pathfinder 2e
 * system for Foundry VTT (https://github.com/foundryvtt/pf2e); the implementation is original. */
export default class Knave2ePartySheet extends foundry.appv1.sheets.ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['knave2e', 'sheet', 'actor', 'document-sheet'],
            width: 900,
            height: 820,
            dragDrop: [{ dragSelector: '.party-member[draggable]', dropSelector: null }],
            tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'roster' }],
        });
    }

    /** Client-side view state, kept across renders. */
    _collapsed = new Set();
    _inventoryFilter = { holder: '', type: '', text: '' };

    get template() {
        return 'systems/knave2e/templates/actor/actor-party-sheet.hbs';
    }

    /* -------------------------------------------- */
    /*  Data                                        */
    /* -------------------------------------------- */

    async getData() {
        const context = super.getData();
        context.appId = this.appId;
        const system = this.actor.toObject(false).system;
        context.system = system;
        const { members, missing } = resolveMembers(this.actor);

        context.tabs = PARTY_TABS.filter((tab) => tab.always || tab.test(members)).map((tab, i) => ({
            ...tab,
            index: ROMAN[i],
            label: `KNAVE2E.Party.Tab.${tab.id}`,
        }));
        const has = (id) => context.tabs.some((tab) => tab.id === id);
        context.partyRoles = {
            '': 'KNAVE2E.Party.RoleNone',
            ...Object.fromEntries(PARTY_ROLES.map((role) => [role, `KNAVE2E.Party.Role.${role}`])),
        };

        context.roster = this._prepareRoster(members, missing, system);
        if (has('characters')) context.characters = this._prepareCharacters(members);
        if (has('inventory')) context.inventory = this._prepareInventory(members);
        if (has('retinue')) context.retinue = this._prepareRetinue(members);
        if (has('holdings')) context.holdings = this._prepareHoldings(members);
        if (has('armies')) context.armies = this._prepareArmies(members);
        context.totals = this._prepareTotals(members);
        context.system.enrichedHTML = await foundry.applications.ux.TextEditor.implementation.enrichHTML(system.description);
        return context;
    }

    _visible(actor) {
        return actor.testUserPermission(game.user, 'OBSERVER');
    }

    _base(member) {
        const { actor } = member;
        return {
            uuid: member.uuid,
            name: actor.name,
            img: actor.img,
            type: actor.type,
            group: member.group,
            canOpen: this._visible(actor),
            canEdit: actor.isOwner,
        };
    }

    _prepareRoster(members, missing, system) {
        const folders = system.folders.map((folder) => ({ ...folder, members: [], collapsed: this._collapsed.has(folder.id) }));
        const root = [];
        for (const member of members) {
            const row = {
                ...this._base(member),
                typeIcon: TYPE_ICONS[member.actor.type],
                roleTag: roleTagOf(member.actor),
            };
            (folders.find((folder) => folder.id === member.folder)?.members ?? root).push(row);
        }
        for (const entry of missing) root.push({ uuid: entry.uuid, missing: true });
        folders.forEach((folder) => (folder.count = folder.members.length));
        return { folders, root, isEmpty: !members.length && !missing.length };
    }

    _prepareCharacters(members) {
        const statuses = CONFIG.statusEffects
            .filter((status) => status.id)
            .map((status) => ({ id: status.id, name: game.i18n.localize(status.name ?? status.id) }));
        const rows = members
            .filter((m) => m.group === 'players')
            .map((m) => {
                const sys = m.actor.system;
                const base = this._base(m);
                const row = { ...base, hidden: !base.canOpen };
                if (row.hidden) return row;
                row.level = sys.level;
                row.label = sys.label;
                row.xp = { value: sys.xp.value, progress: sys.xp.progress };
                row.hp = sys.hitPoints;
                row.wounds = sys.wounds;
                row.ac = sys.armorClass;
                row.careers = sys.careers;
                row.conditions = m.actor.effects.contents
                    .filter((effect) => !effect.disabled && effect.statuses?.size)
                    .map((effect) => ({
                        id: [...effect.statuses][0],
                        name: game.i18n.localize(effect.name),
                        img: effect.img,
                    }));
                return row;
            });
        return { rows, statuses };
    }

    _prepareInventory(members) {
        const filter = this._inventoryFilter;
        const holders = members
            .filter((m) => INVENTORY_HOLDER_TYPES.includes(m.actor.type) && this._visible(m.actor))
            .map((m) => ({
                ...this._base(m),
                slots: { value: Number(m.actor.system.slots.value), max: Number(m.actor.system.slots.max) },
                limitEditable: MANUAL_LIMIT_TYPES.includes(m.actor.type) && m.actor.isOwner,
                items: [],
            }));
        const types = new Set();
        const text = filter.text.trim().toLowerCase();
        for (const holder of holders) {
            const actor = fromUuidSync(holder.uuid);
            for (const item of actor.items) {
                if (item.type === 'monsterAttack' || !item.system) continue;
                types.add(item.type);
                if (filter.holder && filter.holder !== holder.uuid) continue;
                if (filter.type && filter.type !== item.type) continue;
                if (text && !item.name.toLowerCase().includes(text)) continue;
                const quantity = item.system.quantity ?? 1;
                holder.items.push({
                    id: item.id,
                    name: item.name,
                    img: item.img,
                    type: item.type,
                    typeLabel: game.i18n.localize(`TYPES.Item.${item.type}`),
                    quantity,
                    slots: item.system.slots,
                    totalSlots: Number((quantity * item.system.slots).toFixed(2)),
                    cost: item.system.cost,
                });
            }
        }
        const owned = holders.filter((holder) => holder.canEdit);
        for (const holder of holders) {
            holder.transferTargets = holder.canEdit ? owned.filter((other) => other.uuid !== holder.uuid) : [];
        }
        const shown = holders.filter((holder) => holder.items.length || !(filter.holder || filter.type || filter.text));
        return {
            holders: shown,
            filter,
            holderOptions: holders.map((holder) => ({ id: holder.uuid, name: holder.name })),
            typeOptions: [...types].sort().map((type) => ({ id: type, name: game.i18n.localize(`TYPES.Item.${type}`) })),
            itemCount: shown.reduce((n, holder) => n + holder.items.length, 0),
            slots: {
                value: Number(holders.reduce((n, holder) => n + holder.slots.value, 0).toFixed(2)),
                max: holders.reduce((n, holder) => n + holder.slots.max, 0),
            },
        };
    }

    _prepareRetinue(members) {
        const groups = RETINUE_GROUPS.map((id) => ({ id, label: `KNAVE2E.Party.Group.${id}`, rows: [] }));
        for (const m of members.filter((member) => RETINUE_GROUPS.includes(member.group))) {
            const sys = m.actor.system;
            const base = this._base(m);
            const row = { ...base, hidden: !base.canOpen, retainer: ['recruit', 'monster'].includes(m.actor.type), role: sys.partyRole ?? '' };
            if (!row.hidden) {
                row.roleTag = m.group;
                row.level = sys.level;
                row.hp = sys.hitPoints;
                row.ac = sys.armorClass;
                row.morale = sys.morale;
                row.cost = m.actor.type === 'recruit' && m.group !== 'companion' ? sys.costPerMonth : null;
                row.carry = sys.slots ? { value: Number(sys.slots.value), max: Number(sys.slots.max) } : null;
            }
            groups.find((group) => group.id === m.group).rows.push(row);
        }
        const rows = groups.flatMap((group) => group.rows);
        return {
            groups: groups.filter((group) => group.rows.length),
            upkeep: rows.reduce((n, row) => n + (row.cost ?? 0), 0),
        };
    }

    _prepareHoldings(members) {
        const vehicles = [];
        const buildings = [];
        for (const m of members) {
            if (!['vehicles', 'buildings'].includes(m.group)) continue;
            const sys = m.actor.system;
            const base = this._base(m);
            const row = { ...base, hidden: !base.canOpen };
            if (!row.hidden) {
                row.coins = sys.coins;
                row.carry = { value: Number(sys.slots.value), max: Number(sys.slots.max) };
                if (m.group === 'vehicles') {
                    Object.assign(row, { crew: sys.crew, cost: sys.cost });
                } else {
                    const style = CONFIG.SYSTEM.BUILDING.ROOM_STYLES[sys.roomStyle];
                    Object.assign(row, {
                        squares: sys.squares,
                        styleLabel: style?.label,
                        baseCost: sys.baseCost,
                        staffing: sys.annualStaffingCost,
                        rental: sys.monthlyRentalIncome,
                        business: sys.isBusiness,
                        staffed: sys.staffed,
                    });
                }
            }
            (m.group === 'vehicles' ? vehicles : buildings).push(row);
        }
        const sum = (rows, key) => rows.reduce((n, row) => n + (row[key] ?? 0), 0);
        return {
            vehicles,
            buildings,
            vehicleValue: sum(vehicles, 'cost'),
            buildingValue: sum(buildings, 'baseCost'),
            staffing: sum(buildings, 'staffing'),
            rental: sum(buildings, 'rental'),
        };
    }

    _prepareArmies(members) {
        const fixed = (n) => (Number.isInteger(n) ? n : Number(n.toFixed(2)));
        const rows = members
            .filter((m) => m.group === 'armies')
            .map((m) => {
                const sys = m.actor.system;
                const base = this._base(m);
                const row = { ...base, hidden: !base.canOpen };
                if (!row.hidden) {
                    const unit = CONFIG.SYSTEM.ARMY.UNIT_TYPES[sys.unitType];
                    Object.assign(row, {
                        unitLabel: unit?.label,
                        troops: sys.troops,
                        blocks: fixed(sys.blocks),
                        multiplier: `${Math.round(sys.powerMultiplier * 100)}%`,
                        power: fixed(sys.fightingPower),
                        rawPower: sys.fightingPower,
                        cost: sys.monthlyCost,
                        leader: sys.leader,
                    });
                }
                return row;
            });
        const power = rows.reduce((n, row) => n + (row.rawPower ?? 0), 0);
        return {
            rows,
            troops: rows.reduce((n, row) => n + (row.troops ?? 0), 0),
            power: fixed(power),
            rawPower: power,
            cost: rows.reduce((n, row) => n + (row.cost ?? 0), 0),
        };
    }

    _prepareTotals(members) {
        const totals = { members: members.length, upkeep: 0, coins: 0, hp: 0, hpMax: 0 };
        for (const m of members) {
            if (!this._visible(m.actor)) continue;
            const sys = m.actor.system;
            if (m.actor.type === 'recruit' && m.group !== 'companion') totals.upkeep += sys.costPerMonth ?? 0;
            if (Number.isFinite(sys.coins)) totals.coins += sys.coins;
            if (sys.hitPoints && m.actor.type !== 'building' && m.actor.type !== 'vehicle') {
                totals.hp += sys.hitPoints.value;
                totals.hpMax += sys.hitPoints.max;
            }
        }
        return totals;
    }

    /* -------------------------------------------- */
    /*  Listeners                                   */
    /* -------------------------------------------- */

    activateListeners(html) {
        super.activateListeners(html);

        // A tab disappears when the last matching actor leaves; fall back to the roster.
        const tabs = this._tabs?.[0];
        if (tabs && !html[0].querySelector(`.sheet-tabs [data-tab="${tabs.active}"]`)) tabs.activate('roster');

        html.find('.folder-toggle').on('click', (event) => {
            const id = event.currentTarget.closest('[data-folder]').dataset.folder;
            const folder = event.currentTarget.closest('.party-folder');
            this._collapsed.has(id) ? this._collapsed.delete(id) : this._collapsed.add(id);
            folder.classList.toggle('collapsed', this._collapsed.has(id));
        });

        html.find('.party-open').on('click', (event) => {
            const row = event.currentTarget.closest('[data-uuid]');
            const actor = fromUuidSync(row.dataset.uuid);
            if (!actor?.testUserPermission(game.user, 'OBSERVER')) return;
            const itemId = event.currentTarget.dataset.itemId;
            (itemId ? actor.items.get(itemId) : actor)?.sheet.render(true);
        });

        html.find('.inventory-filter').on('change', (event) => {
            const field = event.currentTarget.dataset.filter;
            this._inventoryFilter[field] = event.currentTarget.value;
            this.render(false);
        });

        html.find('.party-warfare').on('click', () => {
            const power = this._armyPower;
            return game.knave2e.warfare.resolveBattle({ sideA: power });
        });
        this._armyPower = Number(html.find('.party-warfare').data('power') ?? 0);

        if (!this.isEditable) return;

        html.find('.party-remove').on('click', (event) => {
            const uuid = event.currentTarget.closest('[data-uuid]').dataset.uuid;
            return this.actor.update({ 'system.members': this.actor.system.members.filter((m) => m.uuid !== uuid) });
        });

        html.find('.folder-add').on('click', () => {
            const folders = [...this.actor.system.folders, { id: foundry.utils.randomID(), name: game.i18n.localize('KNAVE2E.Party.NewFolder') }];
            return this.actor.update({ 'system.folders': folders });
        });

        html.find('.folder-name').on('change', (event) => {
            const id = event.currentTarget.closest('[data-folder]').dataset.folder;
            const name = event.currentTarget.value.trim() || game.i18n.localize('KNAVE2E.Party.NewFolder');
            return this.actor.update({ 'system.folders': this.actor.system.folders.map((f) => (f.id === id ? { id, name } : f)) });
        });

        html.find('.folder-delete').on('click', (event) => {
            const id = event.currentTarget.closest('[data-folder]').dataset.folder;
            return this.actor.update({
                'system.folders': this.actor.system.folders.filter((f) => f.id !== id),
                // Members of a deleted folder return to the root.
                'system.members': this.actor.system.members.map((m) => (m.folder === id ? { ...m, folder: '' } : m)),
            });
        });

        html.find('.party-role-select').on('change', (event) => {
            const actor = fromUuidSync(event.currentTarget.closest('[data-uuid]').dataset.uuid);
            if (!actor?.isOwner) return ui.notifications.warn(game.i18n.localize('KNAVE2E.Party.NotOwner'));
            return actor.update({ 'system.partyRole': event.currentTarget.value });
        });

        html.find('.party-edit').on('change', (event) => {
            const input = event.currentTarget;
            const actor = fromUuidSync(input.closest('[data-uuid]').dataset.uuid);
            if (!actor?.isOwner) return ui.notifications.warn(game.i18n.localize('KNAVE2E.Party.NotOwner'));
            if (input.dataset.type === 'string') return actor.update({ [input.dataset.field]: input.value.trim() });
            const value = Number(input.value);
            if (!Number.isFinite(value)) return this.render(false);
            return actor.update({ [input.dataset.field]: value });
        });

        html.find('.party-condition-add').on('change', async (event) => {
            const select = event.currentTarget;
            const actor = fromUuidSync(select.closest('[data-uuid]').dataset.uuid);
            if (!select.value || !actor?.isOwner) return;
            await actor.toggleStatusEffect(select.value, { active: true });
        });

        html.find('.party-condition').on('click', async (event) => {
            const actor = fromUuidSync(event.currentTarget.closest('[data-uuid]').dataset.uuid);
            if (!actor?.isOwner) return;
            await actor.toggleStatusEffect(event.currentTarget.dataset.status, { active: false });
        });

        html.find('.party-transfer').on('change', (event) => {
            const select = event.currentTarget;
            const from = fromUuidSync(select.closest('[data-uuid]').dataset.uuid);
            const to = fromUuidSync(select.value);
            const item = from?.items.get(select.dataset.itemId);
            if (!item || !to) return;
            return this._transfer(item, from, to);
        });
    }

    /** Move an item between two members who both belong to the user. */
    async _transfer(item, from, to) {
        if (!from.isOwner || !to.isOwner) return ui.notifications.warn(game.i18n.localize('KNAVE2E.Party.NotOwner'));
        const data = item.toObject();
        delete data._id;
        await to.createEmbeddedDocuments('Item', [data]);
        await item.delete();
        ui.notifications.info(game.i18n.format('KNAVE2E.Party.Transferred', { item: item.name, to: to.name }));
    }

    /* -------------------------------------------- */
    /*  Drag and drop                               */
    /* -------------------------------------------- */

    _onDragStart(event) {
        const uuid = event.currentTarget.dataset.uuid;
        event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'Actor', uuid }));
    }

    async _onDrop(event) {
        if (!this.isEditable) return;
        const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
        if (data?.type !== 'Actor') return;
        const folder = event.target.closest?.('[data-folder]')?.dataset.folder ?? '';
        return this._enlist(data.uuid, folder);
    }

    _enlist(uuid, folder = '') {
        return enlistActor(this.actor, uuid, folder);
    }
}
