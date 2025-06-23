// questProgressServiceUsers.web.js
// Modernes Webmodul (.web.js) für User-Quest-Fortschritts-Logik in Wix Studio / Velo

import wixData from 'wix-data';
import { resolveMemberDocId } from 'backend/utils/memberResolver.web.js';
import { addXp } from 'backend/services/xpServiceUsers.web.js';

/**
 * updateProgress
 * --------------
 * Aktualisiert den Fortschritt eines Nutzers für eine definierte Quest.
 * Legt bei erstem Aufruf einen QuestProgressUsers-Eintrag an.
 * Bei Erreichen des Ziels wird XP verbucht und optional ein Badge vergeben.
 *
 * @param {string} memberId   - Wix Users API ID des Nutzers
 * @param {string} questId    - ID des QuestDef-Dokuments
 * @param {number} increment  - Wert, um den der Fortschritt erhöht wird
 * @returns {Promise<object>} - { success: true, current, target, completed }
 * @throws {Error}           - Bei fehlendem Member- oder Quest-Eintrag
 */
export async function updateProgress(memberId, questId, increment) {
  // 1. Internes Document-ID auflösen
  const userDocId = await resolveMemberDocId(memberId);

  // 2. QuestDef laden (zur Bestimmung des Zielwerts und XP)
  const questDef = await wixData.get('QuestDef', questId);
  if (!questDef) throw new Error(`QuestDef "${questId}" nicht gefunden.`);

  // 3. Bestehenden Fortschritt abrufen
  const query = await wixData.query('QuestProgressUsers')
    .eq('userId', userDocId)
    .eq('questId', questId)
    .limit(1)
    .find();

  let progress = query.items[0];
  const now = new Date();

  // Wenn kein Eintrag existiert, anlegen
  if (!progress) {
    progress = {
      userId:     userDocId,
      questId:    questId,
      current:    0,
      target:     questDef.targetValue,
      periodStart: now
    };
    const insertResult = await wixData.insert('QuestProgressUsers', progress);
    progress._id = insertResult._id;
  }

  // 4. Fortschritt erhöhen (max. target)
  const newCurrent = Math.min(progress.current + increment, progress.target);
  progress.current = newCurrent;

  // 5. Update speichern
  await wixData.update('QuestProgressUsers', progress);

  // 6. Bei Abschluss: XP geben und Badge auslösen
  let completed = false;
  if (newCurrent >= progress.target) {
    completed = true;
    // Quest XP (User)
    await addXp(memberId, questDef.xpRewardUser, `Quest Complete: ${questDef.name}`, { questId });
    // Optional: Badge vergeben, wenn definiert
    if (questDef.badgeId) {
      // importiere und rufe badgeServiceUsers.awardBadge hier auf (falls gewünscht)
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
 * import { updateProgress } from 'backend/services/questProgressServiceUsers.web.js';
 *
 * $w.onReady(async () => {
 *   const res = await updateProgress(wixUsers.currentUser.id, 'questDef123', 1);
 *   console.log(res);
 * });
 */