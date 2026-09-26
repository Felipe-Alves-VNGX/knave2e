import Knave2eItemType from "./item-type.mjs";

export default class Knave2ePotion extends Knave2eItemType {
  static DEFAULT_CATEGORY = "potion";

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    // Ingredients used to brew this potion (monster parts, rare substances, etc.)
    schema.ingredients = new fields.StringField({ initial: "" });

    // Set once a brewing check succeeds by a margin of 10+, allowing future
    // batches with the same ingredients to skip the check entirely.
    schema.hasRecipe = new fields.BooleanField({ initial: false });

    return schema;
  }
}
