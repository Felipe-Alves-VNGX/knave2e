/** A party is a folder-like actor: a roster of world actors, optionally sorted into subfolders.
 * The idea of a Party actor that nests characters and their followers is borrowed from the
 * Pathfinder 2e system for Foundry VTT (https://github.com/foundryvtt/pf2e); no code from it is used. */
export default class Knave2eParty extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.StringField({ initial: '' }),
            // World actors, in the order they joined; `folder` is a subfolder id or empty for the root.
            members: new fields.ArrayField(
                new fields.SchemaField({
                    uuid: new fields.StringField({ required: true, blank: false }),
                    folder: new fields.StringField({ required: true, blank: true, initial: '' }),
                })
            ),
            folders: new fields.ArrayField(
                new fields.SchemaField({
                    id: new fields.StringField({ required: true, blank: false }),
                    name: new fields.StringField({ required: true, blank: true, initial: '' }),
                })
            ),
        };
    }

    static migrateData(source) {
        if (Array.isArray(source.members)) {
            source.members = source.members.map((m) => (typeof m === 'string' ? { uuid: m, folder: '' } : m));
        }
        return super.migrateData(source);
    }
}
