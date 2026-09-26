// Downtime activities: carousing, gambling, and career training cost lookup.
// Purely procedural/numeric mechanics — no book flavor tables (e.g. carousing
// mishaps) are reproduced here; the GM applies their own consequences.

const SETTLEMENT_COST_DICE = {
    village: 50,
    town: 100,
    city: 200,
};

const CAREER_TIERS = {
    common: { practiceMonths: 1, practiceCost: 1000, bonusMonths: 1, bonusCost: 1000 },
    uncommon: { practiceMonths: 3, practiceCost: 5000, bonusMonths: 3, bonusCost: 5000 },
    rare: { practiceMonths: 12, practiceCost: 30000, bonusMonths: 12, bonusCost: 30000 },
};

export async function carouse(actor) {
    if (!actor) return ui.notifications.warn(game.i18n.localize('KNAVE2E.SelectActorFirst'));

    const settlement = await Dialog.wait({
        title: game.i18n.localize('KNAVE2E.Carouse'),
        content: `<p>${game.i18n.localize('KNAVE2E.CarouseDialog')}</p>`,
        buttons: {
            village: { label: game.i18n.localize('KNAVE2E.Village'), callback: () => 'village' },
            town: { label: game.i18n.localize('KNAVE2E.Town'), callback: () => 'town' },
            city: { label: game.i18n.localize('KNAVE2E.City'), callback: () => 'city' },
        },
        default: 'town',
    });
    if (!settlement) return;

    const multiplier = SETTLEMENT_COST_DICE[settlement];
    const costRoll = await new Roll(`1d10 * ${multiplier}`).evaluate();
    const cost = costRoll.total;

    const conBonus = actor.system.abilities?.constitution?.value ?? 0;
    const conRoll = await new Roll(`1d20 + ${conBonus}`).evaluate();
    const conSuccess = conRoll.total >= 11;

    await actor.update({
        'system.coins': Math.max(0, (actor.system.coins ?? 0) - cost),
        'system.xp.value': (actor.system.xp?.value ?? 0) + cost,
    });

    const flavor = conSuccess
        ? game.i18n.format('KNAVE2E.CarouseSuccess', { actor: actor.name, cost, xp: cost })
        : game.i18n.format('KNAVE2E.CarouseMishap', { actor: actor.name, cost, xp: cost });

    await conRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor });
    return { cost, conSuccess };
}

export async function gamble(actor) {
    if (!actor) return ui.notifications.warn(game.i18n.localize('KNAVE2E.SelectActorFirst'));

    const wager = await Dialog.wait({
        title: game.i18n.localize('KNAVE2E.Gamble'),
        content: `
            <div class="form-group">
                <label>${game.i18n.localize('KNAVE2E.Wager')}</label>
                <input type="number" name="wager" value="10" min="1" />
            </div>`,
        buttons: {
            ok: {
                label: game.i18n.localize('KNAVE2E.Gamble'),
                callback: (html) => Number(html.find('[name="wager"]').val()) || 0,
            },
        },
        default: 'ok',
    });
    if (!wager || wager <= 0) return;
    if ((actor.system.coins ?? 0) < wager) {
        return ui.notifications.warn(game.i18n.localize('KNAVE2E.NotEnoughCoins'));
    }

    const houseRoll = await new Roll('1d6').evaluate();

    const choice = await Dialog.wait({
        title: game.i18n.localize('KNAVE2E.Gamble'),
        content: `<p>${game.i18n.format('KNAVE2E.GambleHouseRoll', { roll: houseRoll.total })}</p>`,
        buttons: {
            bow: {
                label: game.i18n.localize('KNAVE2E.GambleBowOut'),
                callback: () => 'bow',
            },
            play: {
                label: game.i18n.localize('KNAVE2E.GambleContinue'),
                callback: () => 'play',
            },
        },
        default: 'play',
    });
    if (!choice) return;

    let outcome, delta;
    let playerRoll = null;
    if (choice === 'bow') {
        delta = -Math.floor(wager / 2);
        outcome = 'KNAVE2E.GambleBowOutResult';
    } else {
        playerRoll = await new Roll('1d6').evaluate();
        if (playerRoll.total > houseRoll.total) {
            delta = wager;
            outcome = 'KNAVE2E.GambleWin';
        } else {
            delta = -wager;
            outcome = 'KNAVE2E.GambleLose';
        }
    }

    await actor.update({ 'system.coins': Math.max(0, (actor.system.coins ?? 0) + delta) });

    const flavor = game.i18n.format(outcome, { actor: actor.name, wager, delta: Math.abs(delta) });
    const finalRoll = playerRoll ?? houseRoll;
    await finalRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor });
    return { delta };
}

export async function careerTrainingReference(actor = null) {
    const rows = Object.entries(CAREER_TIERS)
        .map(([tier, data]) => {
            const label = game.i18n.localize(`KNAVE2E.CareerTier.${tier}`);
            return `<tr>
                <td>${label}</td>
                <td>${data.practiceMonths} / ${data.practiceCost}c</td>
                <td>${data.bonusMonths} / ${data.bonusCost}c</td>
            </tr>`;
        })
        .join('');

    const content = `
        <table class="knave2e-career-reference">
            <thead>
                <tr>
                    <th>${game.i18n.localize('KNAVE2E.CareerTier.header')}</th>
                    <th>${game.i18n.localize('KNAVE2E.CareerPractice')}</th>
                    <th>${game.i18n.localize('KNAVE2E.CareerBonus')}</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;

    return ChatMessage.create({
        speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
        flavor: game.i18n.localize('KNAVE2E.CareerTrainingCosts'),
        content,
    });
}
