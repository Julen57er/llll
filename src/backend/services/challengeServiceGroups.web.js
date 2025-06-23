// challengeServiceGroups.web.js
// Modernes Webmodul (.web.js) für Group-Challenge-Logik in Wix Studio / Velo

import wixData from 'wix-data';
import { addXp as addGroupXp } from 'backend/services/xpServiceGroups.web.js';

/**
 * joinChallenge
 * -------------
 * Meldet eine Gruppe zu einer Challenge an und legt einen Eintrag in ChallengeStatsGroups an.
 *
 * @param {string} groupId      - ID der Gruppe aus der Groups-Collection
 * @param {string} challengeId  - ID des ChallengeDef-Dokuments
 * @returns {Promise<object>}   - { success: true, statsEntry } oder { skipped: true, reason }
 * @throws {Error}              - Bei fehlendem Gruppen- oder Challenge-Eintrag
 */
export async function joinChallenge(groupId, challengeId) {
  // Prüfen, ob bereits ein Eintrag existiert
  const existingRes = await wixData.query('ChallengeStatsGroups')
    .eq('groupId', groupId)
    .eq('challengeId', challengeId)
    .limit(1)
    .find();

  if (existingRes.items.length > 0) {
    return { skipped: true, reason: 'Gruppe bereits angemeldet', statsEntry: existingRes.items[0] };
  }

  // Neuen Eintrag anlegen
  const statsEntry = {
    groupId:          groupId,
    challengeId:      challengeId,
    state:            'Draft',
    contributionScore: 0
  };
  const insertResult = await wixData.insert('ChallengeStatsGroups', statsEntry);

  return { success: true, statsEntry: insertResult };
}

/**
 * submitChallenge
 * ----------------
 * Speichert die Einreichung einer Gruppe und setzt den Status auf "Submission".
 *
 * @param {string} groupId      - ID der Gruppe aus der Groups-Collection
 * @param {string} challengeId  - ID des ChallengeDef-Dokuments
 * @param {object} payload      - Daten der Einreichung (z.B. Media-URL, Beschreibung)
 * @returns {Promise<object>}   - { success: true, updatedEntry }
 * @throws {Error}              - Bei fehlendem Stats-Eintrag oder Datenbankfehlern
 */
export async function submitChallenge(groupId, challengeId, payload) {
  // Bestehenden Stats-Eintrag abrufen
  const queryRes = await wixData.query('ChallengeStatsGroups')
    .eq('groupId', groupId)
    .eq('challengeId', challengeId)
    .limit(1)
    .find();

  const statsEntry = queryRes.items[0];
  if (!statsEntry) {
    throw new Error(`Kein Stats-Eintrag für Gruppe ${groupId} und Challenge ${challengeId}`);
  }

  // Einreichung speichern und Status setzen
  statsEntry.state = 'Submission';
  statsEntry.payload = payload;
  statsEntry.submittedAt = new Date();

  const updatedEntry = await wixData.update('ChallengeStatsGroups', statsEntry);

  return { success: true, updatedEntry };
}

/**
 * Hinweis:
 * Bewertungs- und Abschluss-Logik (z.B. Punktevergabe) wird im `challengeWorker.js` durchgeführt.
 * Dieser Service fokussiert auf Gruppen-Seite: Beitritt und Einreichung.
 *
 * Usage-Beispiele:
 * import { joinChallenge, submitChallenge } from 'backend/services/challengeServiceGroups.web.js';
 */