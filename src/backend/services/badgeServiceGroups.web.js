// badgeServiceGroups.web.js
// Modernes Webmodul (.web.js) für Group-Badge-Logik in Wix Studio / Velo

import wixData from 'wix-data';
import { addXp as addGroupXp } from 'backend/services/xpServiceGroups.web.js';

/**
 * awardBadge
 * ----------
 * Vergibt ein Badge an eine Gruppe, handhabt Tier-Upgrades und gewährt ggf. sofort XP.
 * Speichert in GroupBadges und ruft xpServiceGroups.addXp auf.
 *
 * @param {string} groupId - Die ID der Gruppe aus der Groups-Collection
 * @param {string} badgeId - Die ID des BadgeDef-Dokuments
 * @param {number} [tier=0] - Die gewünschte Badge-Stufe (0 = Basis)
 * @returns {Promise<object>} - { success: true, newTier, xpAwarded } oder { skipped: true, reason }
 * @throws {Error} - Bei fehlender Gruppeneintrag oder Datenbankfehlern
 */
export async function awardBadge(groupId, badgeId, tier = 0) {
  // 1. Bestehende Badge prüfen
  const existingRes = await wixData.query('GroupBadges')
    .eq('groupId', groupId)
    .eq('badgeId', badgeId)
    .limit(1)
    .find();

  const existing = existingRes.items[0];
  if (existing && existing.tier >= tier) {
    // Keine Neuvergabe oder Downgrade
    return { skipped: true, reason: 'Tier schon erreicht', currentTier: existing.tier };
  }

  // 2. BadgeDef laden
  const badgeDef = await wixData.get('BadgeDef', badgeId);
  // Bestimmen der XP-Vergabe
  let xpAward = badgeDef.pointsAwarded || 0;
  if (badgeDef.tierXpJson) {
    try {
      const tierArray = JSON.parse(badgeDef.tierXpJson);
      if (Array.isArray(tierArray) && tierArray[tier] != null) {
        xpAward = tierArray[tier];
      }
    } catch {
      // Ungültiges JSON, Fallback auf pointsAwarded
    }
  }

  // 3. Upsert in GroupBadges
  const badgeEntry = {
    _id:    existing?._id,
    groupId,
    badgeId,
    tier,
    earnedAt: new Date(),
    hidden: false
  };
  const saved = await wixData.save('GroupBadges', badgeEntry);

  // 4. XP drop ausführen, falls >0
  let xpResult = null;
  if (xpAward > 0) {
    xpResult = await addGroupXp(groupId, xpAward, `Badge: ${badgeDef.name}`, { badgeId, tier });
  }

  return { success: true, newTier: tier, xpAwarded: xpResult?.xpAwarded || 0 };
}

/**
 * Usage-Beispiel:
 *
 * import { awardBadge } from 'backend/services/badgeServiceGroups.web.js';
 *
 * $w.onReady(async () => {
 *   const result = await awardBadge('groupDocId123', 'badgeDef123', 1);
 *   console.log(result);
 * });
 */
