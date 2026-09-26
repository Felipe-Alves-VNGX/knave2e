// Alchemy: brewing potions from harvested ingredients.
// Mechanical procedure only (INT check, optional extra watch for +5, and
// recipe discovery on a strong success) — no book flavor text or tables.

const BREW_DC = 11; // baseline difficulty per the standard check target

export async function onBrewPotion(event) {
    event.preventDefault();
    const a = event.currentTarget;

    const li = a.closest('li');
    const item = li.dataset.itemId ? this.actor.items.get(li.dataset.itemId) : null;
    if (!item) return;

    return brewPotion(this.actor, item);
}

export async function brewPotion(actor, item) {
    const speaker = ChatMessage.getSpeaker({ actor });

    // Once a recipe is known, no check is required to brew another batch.
    if (item.system.hasRecipe) {
        await item.update({ 'system.quantity': item.system.quantity + 1 });
        return ChatMessage.create({
            speaker,
            content: `${game.i18n.format('KNAVE2E.BrewedFromRecipe', { item: item.name, actor: actor.name })}`,
        });
    }

    const extraWatch = await Dialog.wait({
        title: game.i18n.localize('KNAVE2E.Brew'),
        content: `${game.i18n.localize('KNAVE2E.BrewDialog')}<br/>${game.i18n.localize('KNAVE2E.SkipDialog')}<br/>`,
        buttons: {
            standard: {
                label: game.i18n.localize('KNAVE2E.Standard'),
                callback: () => false,
            },
            extra: {
                label: game.i18n.localize('KNAVE2E.BrewExtraWatch'),
                callback: () => true,
            },
        },
        default: 'standard',
    });
    if (extraWatch === null || extraWatch === undefined) return;

    const bonus = extraWatch ? 5 : 0;
    const intBonus = actor.system.abilities?.intelligence?.value ?? 0;

    const roll = await new Roll(`1d20 + ${intBonus} + ${bonus}`).evaluate();
    const margin = roll.total - BREW_DC;
    const success = margin >= 0;

    const updates = {};
    if (success) {
        updates['system.quantity'] = item.system.quantity + 1;
        if (margin >= 10) updates['system.hasRecipe'] = true;
    }
    if (Object.keys(updates).length) await item.update(updates);

    let flavor = success
        ? game.i18n.format('KNAVE2E.BrewSuccess', { item: item.name })
        : game.i18n.format('KNAVE2E.BrewFailure', { item: item.name });
    if (success && margin >= 10) {
        flavor += ` ${game.i18n.localize('KNAVE2E.BrewRecipeLearned')}`;
    }

    await roll.toMessage({ speaker, flavor });
    return roll;
}
