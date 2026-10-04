import { SYSTEM } from '../config/system.mjs';

/** A military force for the Warfare procedure: troops of one unit type. */
export default class Knave2eArmy extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        const requiredInteger = { required: true, nullable: false, integer: true };
        return {
            description: new fields.StringField({ initial: '' }),
            unitType: new fields.StringField({
                required: true,
                blank: false,
                initial: 'trainedInfantry',
                choices: Object.keys(SYSTEM.ARMY.UNIT_TYPES),
            }),
            troops: new fields.NumberField({ ...requiredInteger, initial: 100, min: 0 }),
            // The GM may raise or lower an army's power by up to 50% for morale and positioning.
            modifier: new fields.NumberField({ ...requiredInteger, initial: 0, min: -50, max: 50 }),
            // A leader who passes a CHA check with a stirring speech adds 50% more.
            speech: new fields.BooleanField({ initial: false }),
            leader: new fields.StringField({ initial: '' }),
        };
    }

    prepareDerivedData() {
        const unit = SYSTEM.ARMY.UNIT_TYPES[this.unitType] ?? SYSTEM.ARMY.UNIT_TYPES.trainedInfantry;
        // Fighting power is measured in blocks; what matters is the ratio between the two sides.
        this.blocks = this.troops / unit.perBlock;
        this.powerMultiplier = 1 + (this.modifier + (this.speech ? 50 : 0)) / 100;
        this.fightingPower = this.blocks * this.powerMultiplier;
        this.monthlyCost = Math.round(this.blocks * SYSTEM.ARMY.COST_PER_BLOCK);
    }
}
