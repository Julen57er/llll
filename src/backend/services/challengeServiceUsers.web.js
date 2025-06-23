// challengeServiceUsers.web.js
// Modernes Webmodul (.web.js) für User-Challenge-Logik in Wix Studio / Velo

import wixData from 'wix-data';
import { resolveMemberDocId } from 'backend/utils/memberResolver.web.js';
import { addXp } from 'backend/services/xpServiceUsers.web.js';

/**
 * joinChallenge
 * -------------
 * Meldet einen Nutzer zu einer Challenge an und legt einen Eintrag in ChallengeStatsUsers an.
 *
 * @param {string} memberId     - Wix Users API ID des Nutzers
 * @param {string} challengeId  - ID des ChallengeDef-Dokuments
 * @returns {Promise<object>}   - { success: true, statsEntry }
 * @throws {Error}              - Bei fehlendem Nutzer- oder Challenge-Eintrag
 */
export async function joinChallenge(memberId, challengeId) {
  const userDocId = await resolveMemberDocId(memberId);

  // Prüfen, ob bereits ein Eintrag existiert
  const existingRes = await wixData.query('ChallengeStatsUsers')
    .eq('userId', userDocId)
    .eq('challengeId', challengeId)
    .limit(1)
    .find();

  if (existingRes.items.length > 0) {
    return { skipped: true, reason: 'Bereits angemeldet', statsEntry: existingRes.items[0] };
  }

  // Neuen Eintrag anlegen
  const statsEntry = {
    userId:            userDocId,
    challengeId:       challengeId,
    state:             'Draft',
    contributionScore: 0
  };
  const insertResult = await wixData.insert('ChallengeStatsUsers', statsEntry);

  return { success: true, statsEntry: insertResult };
}

/**
 * submitChallenge
 * ----------------
 * Speichert die Einreichung eines Nutzers und setzt den Status auf "Submission".
 *
 * @param {string} memberId     - Wix Users API ID des Nutzers
 * @param {string} challengeId  - ID des ChallengeDef-Dokuments
 * @param {object} payload      - Daten der Einreichung (z.B. Media-URL, Beschreibung)
 * @returns {Promise<object>}   - { success: true, updatedEntry }
 * @throws {Error}              - Bei fehlendem Stats-Eintrag oder Datenbankfehlern
 */
export async function submitChallenge(memberId, challengeId, payload) {
  const userDocId = await resolveMemberDocId(memberId);

  // Bestehenden Stats-Eintrag abrufen
  const queryRes = await wixData.query('ChallengeStatsUsers')
    .eq('userId', userDocId)
    .eq('challengeId', challengeId)
    .limit(1)
    .find();

  const statsEntry = queryRes.items[0];
  if (!statsEntry) {
    throw new Error(`Kein Stats-Eintrag für Nutzer ${memberId} und Challenge ${challengeId}`);
  }

  // Einreichung speichern und Status setzen
  statsEntry.state = 'Submission';
  statsEntry.payload = payload;
  statsEntry.submittedAt = new Date();

  const updatedEntry = await wixData.update('ChallengeStatsUsers', statsEntry);

  return { success: true, updatedEntry };
}

/**
 * Optional: Bewertungs- und Abschluss-Logik wird im challengeWorker.js gehandhabt.
 * Dieser Service fokussiert auf User-Seite: Beitritt und Einreichung.
 *
 * Usage-Beispiele:
 * import { joinChallenge, submitChallenge } from 'backend/services/challengeServiceUsers.web.js';
 */
