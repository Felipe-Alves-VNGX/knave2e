/** A party is a roster of world actors. The idea of a dedicated Party actor that groups the
 * characters and their followers is borrowed from the Pathfinder 2e system for Foundry VTT
 * (https://github.com/foundryvtt/pf2e); no code from it is used here. */
export default class Knave2eParty extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.StringField({ initial: '' }),
            // UUIDs of world actors, in the order they joined.
            members: new fields.ArrayField(new fields.StringField({ required: true, blank: false })),
        };
    }
}
