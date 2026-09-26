// Warfare: mass battle resolution. Implements only the numeric procedure
// (fighting power ratio -> bonus tier -> opposed checks) and the six
// mechanical result *slots* needed to run it; the GM narrates every result.

function bonusForRatio(ratio) {
    if (ratio <= 1.5) return 2;
    if (ratio <= 2) return 4;
    if (ratio <= 3) return 6;
    if (ratio <= 4) return 8;
    return 10;
}

const RESULT_SLOTS = ['Capture', 'Loot', 'Slay', 'Rescue', 'Guard', 'Shield'];

export async function resolveBattle() {
    const input = await Dialog.wait({
        title: game.i18n.localize('KNAVE2E.WarfareCalculator'),
        content: `
            <div class="form-group">
                <label>${game.i18n.localize('KNAVE2E.WarfareSideA')}</label>
                <input type="number" name="sideA" value="0" min="0" />
            </div>
            <div class="form-group">
                <label>${game.i18n.localize('KNAVE2E.WarfareSideB')}</label>
                <input type="number" name="sideB" value="0" min="0" />
            </div>`,
        buttons: {
            ok: {
                label: game.i18n.localize('KNAVE2E.WarfareResolve'),
                callback: (html) => ({
                    sideA: Number(html.find('[name="sideA"]').val()) || 0,
                    sideB: Number(html.find('[name="sideB"]').val()) || 0,
                }),
            },
        },
        default: 'ok',
    });
    if (!input) return;

    const { sideA, sideB } = input;
    if (sideA <= 0 || sideB <= 0) {
        return ui.notifications.warn(game.i18n.localize('KNAVE2E.WarfareNeedBothSides'));
    }

    const strongerIsA = sideA >= sideB;
    const strongerPower = strongerIsA ? sideA : sideB;
    const weakerPower = strongerIsA ? sideB : sideA;
    const strongerLabel = strongerIsA
        ? game.i18n.localize('KNAVE2E.WarfareSideA')
        : game.i18n.localize('KNAVE2E.WarfareSideB');
    const weakerLabel = strongerIsA
        ? game.i18n.localize('KNAVE2E.WarfareSideB')
        : game.i18n.localize('KNAVE2E.WarfareSideA');

    const ratio = strongerPower / weakerPower;
    const bonus = bonusForRatio(ratio);

    let successes = 0;
    const rolls = [];
    for (let i = 0; i < 3; i++) {
        const roll = await new Roll(`1d20 + ${bonus}`).evaluate();
        rolls.push(roll);
        if (roll.total >= 11) successes++;
    }
    const failures = 3 - successes;

    const rollsHtml = rolls.map((r) => r.total).join(', ');
    const content = `
        <p>${game.i18n.format('KNAVE2E.WarfareRatio', { ratio: ratio.toFixed(2), bonus })}</p>
        <p>${game.i18n.format('KNAVE2E.WarfareRolls', { rolls: rollsHtml })}</p>
        <p>${game.i18n.format('KNAVE2E.WarfarePicks', {
            strongerLabel,
            successes,
            weakerLabel,
            failures,
        })}</p>
        <p>${game.i18n.localize('KNAVE2E.WarfareResultSlots')}: ${RESULT_SLOTS.join(', ')}</p>`;

    return ChatMessage.create({
        flavor: game.i18n.localize('KNAVE2E.WarfareCalculator'),
        content,
    });
}
