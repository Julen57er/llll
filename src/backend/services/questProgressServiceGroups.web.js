// questProgressServiceGroups.web.js
// Modernes Webmodul (.web.js) für Group-Quest-Fortschritts-Logik in Wix Studio / Velo

import wixData from 'wix-data';
import { addXp as addGroupXp } from 'backend/services/xpServiceGroups.web.js';

/**
 * updateProgress
 * --------------
 * Aktualisiert den Fortschritt einer Gruppe für eine definierte Quest.
 * Legt bei erstem Aufruf einen QuestProgressGroups-Eintrag an.
 * Bei Erreichen des Ziels wird XP verbucht und optional ein Badge vergeben.
 *
 * @param {string} groupId    - ID der Gruppe aus der Groups-Collection
 * @param {string} questId    - ID des QuestDef-Dokuments
 * @param {number} increment  - Wert, um den der Fortschritt erhöht wird
 * @returns {Promise<object>} - { success: true, current, target, completed }
 * @throws {Error}           - Bei fehlender Gruppe oder Quest-Eintrag
 */
export async function updateProgress(groupId, questId, increment) {
  // 1. QuestDef laden (Zielwert und XP)
  const questDef = await wixData.get('QuestDef', questId);
  if (!questDef) throw new Error(`QuestDef "${questId}" nicht gefunden.`);

  // 2. Bestehenden Fortschritt abrufen
  const query = await wixData.query('QuestProgressGroups')
    .eq('groupId', groupId)
    .eq('questId', questId)
    .limit(1)
    .find();

  let progress = query.items[0];
  const now = new Date();

  // Wenn kein Eintrag existiert, anlegen
  if (!progress) {
    progress = {
      groupId:     groupId,
      questId:     questId,
      current:     0,
      target:      questDef.targetValue,
      periodStart: now
    };
    const insertResult = await wixData.insert('QuestProgressGroups', progress);
    progress._id = insertResult._id;
  }

  // 3. Fortschritt erhöhen (max. target)
  const newCurrent = Math.min(progress.current + increment, progress.target);
  progress.current = newCurrent;

  // 4. Update speichern
  await wixData.update('QuestProgressGroups', progress);

  // 5. Bei Abschluss: XP geben und Badge auslösen
  let completed = false;
  if (newCurrent >= progress.target) {
    completed = true;
    // Quest XP (Group)
    await addGroupXp(groupId, questDef.xpRewardGroup, `Quest Complete: ${questDef.name}`, { questId });
    // Optional: Badge vergeben, falls definiert
    if (questDef.badgeId) {
      // importiere und rufe badgeServiceGroups.awardBadge hier auf (falls gewünscht)
    }
  }

  return {
    success:   true,
    current:   progress.current,
    target:    progress.target,
    completed: completed
  };
}

/**
 * Usage-Beispiel:
 *
 * import { updateProgress } from 'backend/services/questProgressServiceGroups.web.js';
 *
 * $w.onReady(async () => {
 *   const res = await updateProgress('groupDocId123', 'questDef123', 1);
 *   console.log(res);
 * });
 */