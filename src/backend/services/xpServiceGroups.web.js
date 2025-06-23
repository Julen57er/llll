// xpServiceGroups.web.js
// Modernes Webmodul (.web.js) für Group-XP-Logik in Wix Studio / Velo

import wixData from 'wix-data';

/**
 * addXp
 * ------
 * Verbucht XP für eine Gruppe, prüft Tages-Cap und handhabt Overflow.
 * Schreibt in XPLogGroups und aktualisiert das GroupXP-Dokument.
 *
 * @param {string} groupId       - ID der Gruppe aus der Groups-Collection
 * @param {number} delta         - Zu vergebendes XP (positiv oder negativ)
 * @param {string} reason        - Begründung für die XP-Änderung
 * @param {object} [meta]        - Zusätzliche Metadaten (questId, badgeId, challengeId, season)
 * @returns {Promise<object>}    - { success: true, xpAwarded, overflow } oder { blocked: true, reason }
 * @throws {Error}               - Bei fehlender Group oder Datenbankfehlern
 */
export async function addXp(groupId, delta, reason, meta = {}) {
  // 1. Tages-Cap prüfen (1 000 XP)
  const CAP = 1000;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Aggregation: Filter auf groupId und timestamp >= startOfDay
  const todayFilter = wixData.filter()
    .eq('groupId', groupId)
    .ge('timestamp', startOfDay);

  const aggregation = await wixData.aggregate('XPLogGroups')
    .filter(todayFilter)
    .sum('delta')
    .run();

  const earnedToday = aggregation.items[0]?.delta_sum || 0;

  if (earnedToday >= CAP) {
    return { blocked: true, reason: 'Daily cap reached' };
  }

  // 2. XP und Overflow berechnen
  let xpToAward = delta;
  let overflow = 0;
  if (earnedToday + delta > CAP) {
    xpToAward = CAP - earnedToday;
    overflow = delta - xpToAward;
  }

  // 3. Log-Eintrag in XPLogGroups
  const logEntry = {
    groupId:     groupId,
    delta:       xpToAward,
    reason:      reason,
    questId:     meta.questId,
    badgeId:     meta.badgeId,
    challengeId: meta.challengeId,
    season:      meta.season,
    timestamp:   new Date()
  };
  await wixData.insert('XPLogGroups', logEntry);

  // 4. GroupXP-Dokument aktualisieren
  const xpRecord = await wixData.get('GroupXP', groupId);
  xpRecord.totalXp    = (xpRecord.totalXp    || 0) + xpToAward;
  xpRecord.overflowXp = (xpRecord.overflowXp || 0) + overflow;
  // TODO: Hier Level-Neuberechnung einfügen
  await wixData.update('GroupXP', xpRecord);

  return { success: true, xpAwarded: xpToAward, overflow };
}

/**
 * Usage-Beispiel:
 *
 * import { addXp } from 'backend/services/xpServiceGroups.web.js';
 *
 * $w.onReady(async () => {
 *   const result = await addXp('groupDocId123', 200, 'Team Challenge Win');
 *   console.log(result);
 * });
 */
