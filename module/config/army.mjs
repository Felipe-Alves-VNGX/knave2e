// Warfare units (Knave 2e Pages, "Warfare"): each unit type is priced per "block" of fighting power,
// and a block costs the same 100,000c per month whatever it is made of. `perBlock` is how many
// soldiers of that type make up one block.
export const COST_PER_BLOCK = 100000;

export const UNIT_TYPES = {
    masterWizard: { id: "masterWizard", label: "KNAVE2E.Army.Unit.masterWizard", perBlock: 1 },
    battleWizard: { id: "battleWizard", label: "KNAVE2E.Army.Unit.battleWizard", perBlock: 4 },
    eliteCavalry: { id: "eliteCavalry", label: "KNAVE2E.Army.Unit.eliteCavalry", perBlock: 25 },
    veteranCavalry: { id: "veteranCavalry", label: "KNAVE2E.Army.Unit.veteranCavalry", perBlock: 50 },
    trainedCavalry: { id: "trainedCavalry", label: "KNAVE2E.Army.Unit.trainedCavalry", perBlock: 100 },
    untrainedCavalry: { id: "untrainedCavalry", label: "KNAVE2E.Army.Unit.untrainedCavalry", perBlock: 200 },
    eliteInfantry: { id: "eliteInfantry", label: "KNAVE2E.Army.Unit.eliteInfantry", perBlock: 50 },
    veteranInfantry: { id: "veteranInfantry", label: "KNAVE2E.Army.Unit.veteranInfantry", perBlock: 100 },
    trainedInfantry: { id: "trainedInfantry", label: "KNAVE2E.Army.Unit.trainedInfantry", perBlock: 200 },
    untrainedInfantry: { id: "untrainedInfantry", label: "KNAVE2E.Army.Unit.untrainedInfantry", perBlock: 400 },
};
