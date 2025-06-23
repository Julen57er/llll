// xpServiceUsers.web.js
// Modernes Webmodul (.web.js) für User-XP-Logik in Wix Studio / Velo

import wixData from 'wix-data';
import { resolveMemberDocId } from 'backend/utils/memberResolver.web.js';

/**
 * addXp
 * ------
 * Verbucht XP für einen Nutzer, prüft Tages-Cap und handhabt Overflow.
 * Schreibt in XPLogUsers und aktualisiert das UserXP-Dokument.
 *
 * @param {string} memberId      - Wix Users API ID des Nutzers
 * @param {number} delta         - Zu vergebendes XP (positiv oder negativ)
 * @param {string} reason        - Begründung für die XP-Änderung
 * @param {object} [meta]        - Zusätzliche Metadaten (questId, badgeId, challengeId, season)
 * @returns {Promise<object>}    - { success: true, xpAwarded, overflow } oder { blocked: true, reason }
 * @throws {Error}               - Bei fehlendem Member-Eintrag oder Datenbankfehlern
 */
export async function addXp(memberId, delta, reason, meta = {}) {
  // 1. Auflösen der internen Document-ID
  const userDocId = await resolveMemberDocId(memberId);

  // 2. Tages-Cap prüfen (500 XP)
  const CAP = 500;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Aggregation: Filter auf userId und timestamp >= startOfDay
  const todayFilter = wixData.filter()
    .eq('userId', userDocId)
    .ge('timestamp', startOfDay);

  const aggregation = await wixData.aggregate('XPLogUsers')
    .filter(todayFilter)
    .sum('delta')
    .run();

  const earnedToday = aggregation.items[0]?.delta_sum || 0;

  if (earnedToday >= CAP) {
    return { blocked: true, reason: 'Daily cap reached' };
  }

  // 3. XP und Overflow berechnen
  let xpToAward = delta;
  let overflow = 0;
  if (earnedToday + delta > CAP) {
    xpToAward = CAP - earnedToday;
    overflow = delta - xpToAward;
  }

  // 4. Log-Eintrag in XPLogUsers
  const logEntry = {
    userId:      userDocId,
    delta:       xpToAward,
    reason:      reason,
    questId:     meta.questId,
    badgeId:     meta.badgeId,
    challengeId: meta.challengeId,
    season:      meta.season,
    timestamp:   new Date()
  };
  await wixData.insert('XPLogUsers', logEntry);

  // 5. UserXP-Dokument aktualisieren
  const xpRecord = await wixData.get('UserXP', userDocId);
  xpRecord.totalXp     = (xpRecord.totalXp   || 0) + xpToAward;
  xpRecord.overflowXp  = (xpRecord.overflowXp|| 0) + overflow;
  // TODO: Hier Level- und Streak-Recalculation einfügen
  await wixData.update('UserXP', xpRecord);

  return { success: true, xpAwarded: xpToAward, overflow };
}

/**
 * Usage-Beispiel:
 *
 * import { addXp } from 'backend/services/xpServiceUsers.web';
 *
 * $w.onReady(async () => {
 *   const result = await addXp(wixUsers.currentUser.id, 100, 'Daily Login');
 *   console.log(result);
 * });
 */
