import Knave2eActorType from './actor-type.mjs';
import { SYSTEM } from '../config/system.mjs';

export default class Knave2eBuilding extends Knave2eActorType {
    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        const schema = super.defineSchema();

        schema.roomStyle = new fields.StringField({
            required: true,
            blank: false,
            initial: 'poor',
            choices: Object.keys(SYSTEM.BUILDING.ROOM_STYLES),
        });
        schema.squares = new fields.NumberField({ ...requiredInteger, initial: 1, min: 1 });
        // Lets a GM price a custom/irregular building instead of the per-square formula.
        schema.costOverride = new fields.NumberField({ required: false, nullable: true, initial: null, min: 0 });
        schema.staffed = new fields.BooleanField({ initial: false });
        schema.isBusiness = new fields.BooleanField({ initial: false });
        schema.coins = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
        // The book gives no storage rule for a building, so the limit is whatever the GM decides.
        schema.slots = new fields.SchemaField({
            value: new fields.NumberField({ required: true, nullable: false, integer: false, initial: 0, min: 0, step: 0.01 }),
            max: new fields.NumberField({ required: true, nullable: false, integer: false, initial: 100, min: 0, step: 0.01 }),
        });

        return schema;
    }

    prepareDerivedData() {
        this.slots.value = Number(
            this.parent.items.reduce((total, item) => total + (item.system?.quantity ?? 0) * (item.system?.slots ?? 0), 0).toFixed(2)
        );
        const style = SYSTEM.BUILDING.ROOM_STYLES[this.roomStyle] ?? SYSTEM.BUILDING.ROOM_STYLES.poor;
        this.baseCost = Number.isFinite(this.costOverride) ? this.costOverride : style.costPerSquare * this.squares;
        // Staffing a non-business building costs half its value per year.
        this.annualStaffingCost = this.staffed ? Math.ceil(this.baseCost * 0.5) : 0;
        // Renting out a building runs roughly 1% of its value per month.
        this.monthlyRentalIncome = Math.ceil(this.baseCost * 0.01);
    }

    async rollAnnualProfit() {
        if (!this.isBusiness) return null;

        const roll = await new Roll(`ceil(1d10 * ${this.baseCost} / 100)`).evaluate();
        await this.parent.update({ 'system.coins': this.coins + roll.total });
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.parent }),
            flavor: game.i18n.format('KNAVE2E.BuildingProfitRoll', { actor: this.parent.name }),
        });
        return roll;
    }
}
