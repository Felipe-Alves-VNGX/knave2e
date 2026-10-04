# CHANGELOG

## 0.7.0
- Add themed icons from game-icons.net (CC BY 3.0, credits in `assets/icons/CREDITS.md`):
  new items get an icon for their type or category (broadsword, bordered shield, torch, spell
  book, potion...) and new actors get a portrait and token for their type (character,
  recruit, monster, vehicle, building, party, army). Existing items and actors keep their art
- The party sheet turns pages between tabs, like the character sheet
- Fix item data being corrupted on Foundry v13: the first item of an actor lost its type and
  system data, which broke the character sheet
- Add the Party actor type, a folder-like sheet you drag actors onto (from the sidebar or
  from another party) and can organise into subfolders. In the Actors directory the party
  expands to list its members and accepts drops. Its tabs only exist while the party holds a
  matching actor: Characters (HP, AC, wounds, XP, level, careers, conditions), a Shared
  stash that pools the items of every sheet with an inventory (and moves items between
  members; the slot limit of vehicles and buildings is edited right there), Retinue (hirelings, mercenaries, experts and companions with upkeep), Holdings
  (buildings and vehicles) and Armies (military strength). The idea is inspired by the
  Pathfinder 2e system (see the README credits).
- Buildings now have an inventory like vehicles do. The book gives neither a storage rule,
  so both slot limits are set by hand (buildings default to 100 slots)
- Add the Army actor type for the Warfare procedure: unit type, troops, morale/position
  modifier and leader speech give fighting power and monthly cost; the Armies tab feeds the
  total into the Warfare Calculator
- Add a role tag (hireling, mercenary, companion) to recruit and monster/NPC sheets;
  it decides where they appear in a party
- Add a side-based combat tracker following the book: one CHA vs CHA check between the
  sides' leaders, and each side acts together in a 10-second round
- Fix document sheets cropping long content (such as long monster descriptions)

## 0.6.0
- Document-style sheets: parchment and leather, ink accents, handwritten fonts, a page-turn
  animation between tabs and a filterable, paginated inventory

## 0.5.0
- Add Alchemy: potion Item type with a brewing mechanic (INT check, optional
  extra watch for +5, recipe discovery on a strong success)
- Add Downtime tools: Carouse and Gamble macros, and a Career Training cost
  reference, exposed under `game.knave2e.downtime`
- Add a Warfare Calculator (fighting power ratio -> bonus -> opposed checks),
  exposed under `game.knave2e.warfare` and as a world macro
- Add Buildings: new "building" Actor type with construction cost, staffing
  upkeep, rental income, and an annual business profit roll
- These add only game mechanics/automation (numbers and procedures); no book
  text, art, or random tables were reproduced

## 0.4.1
- Update system for v14 compatibility
- Replace deprecated global `TextEditor.enrichHTML`, `renderTemplate`, and `loadTemplates` calls with their namespaced `foundry.applications.*` equivalents

## 0.3.3
- Update system for v12 compatibility
- Fix deprecation warnings after migration to v12

## 0.3.2
- Fixed bug affecting item drag-and-drop caused by 0.3.1 release

## 0.3.1
- Fixed bug affecting automatic maximum wound calculation
- Simplified weapon/monster attack damage into a single user input
- Changed styling overrides for compatibility with Monk's Enhanced Journal mod

## 0.3.0
- Added options to disable automation and rule-enforcement features in system settings
- Added options to adjust consumable weights and base level XP in system settings
- PCs and recruits can only equip one armor piece of a given type at once
- Added quantity field to equipment item sheet
- Fixed equipment item slots not rounding to nearest integer by default
- Added dynamic inputs on actor sheets based on game settings
- Added icon to monster attacks on monster sheets
- Fixed maximum HP/wounds bar vertical rendering
- Standardized font weight and background color across static fields and user inputs

## 0.2.2
- All attacks roll their description (not just relics)
- Monster sheets display AP and can roll reverse AP
- New PCs and recruits have "Link Actor Data" selected by default
- Armor can be unequipped for AP calculations without being removed from inventory
- Clicking item names or icons in inventory sends their descriptions to chat (only when items have descriptions)
- Fix labels for toggleable buttons on items in actor inventory

## 0.2.1
- Added support for reverse AP rolls for PCs/recruits
- Reduced size of chat message header font

## 0.2.0
- Added support for Power Attacks, with automatic weapon breaking
- Visual update to character, recruit, and monster sheets
- Re-colored HP and Wounds to match default token attribute bars in Foundry
- Added in-line damage buttons to attack roll chat messages 
- Active relics automatically roll with their description, and can print spell effects directly from chat
- Reversed wound progression direction for more clear interaction with default token attribute bars
- Simplified "number appearing" fields to accept a single string of type Dng(Wild), (e.g. 1d6(3d6))
- Converted multiple notifications into single-user dialog popups to reduce chat spam

## 0.1.2
- Added automatic reminder for maneuevers on an attack roll >= 21

## 0.1.1
- Fixed bug affecting recruit spellcasting
- Updated system background image for Foundry UI
- Changed minor sheet formatting issues - only small changes now, as sheets will change drastically in a future release.

## 0.1.0
- Initial release
