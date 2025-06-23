// badgeServiceUsers.web.js
// Modernes Webmodul (.web.js) für User-Badge-Logik in Wix Studio / Velo

import wixData from 'wix-data';
import { resolveMemberDocId } from 'backend/utils/memberResolver.web.js';
import { addXp } from 'backend/services/xpServiceUsers.web.js';

/**
 * awardBadge
 * ----------
 * Vergibt ein Badge an einen Nutzer, handhabt Tier-Upgrades und gewährt ggf. sofort XP.
 * Speichert in UserBadges und ruft xpServiceUsers.addXp auf.
 *
 * @param {string} memberId - Die Wix Users API ID des Nutzers
 * @param {string} badgeId  - Die ID des BadgeDef-Dokuments
 * @param {number} [tier=0] - Die gewünschte Badge-Stufe (0 = Basis)
 * @returns {Promise<object>} - { success: true, newTier, xpAwarded } oder { skipped: true, reason }
 * @throws {Error} - Bei fehlender Member-Referenz oder Datenbankfehlern
 */
export async function awardBadge(memberId, badgeId, tier = 0) {
  // 1. Auflösen des internen _id
  const userDocId = await resolveMemberDocId(memberId);

  // 2. Bestehende Badge prüfen
  const existingRes = await wixData.query('UserBadges')
    .eq('userId', userDocId)
    .eq('badgeId', badgeId)
    .limit(1)
    .find();

  const existing = existingRes.items[0];
  if (existing && existing.tier >= tier) {
    // Keine Neuvergabe oder Downgrade
    return { skipped: true, reason: 'Tier schon erreicht', currentTier: existing.tier };
  }

  // 3. BadgeDef laden
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
      // Ungültiges JSON, fallback auf pointsAwarded
    }
  }

  // 4. Upsert in UserBadges
  const badgeEntry = {
    _id:    existing?._id,
    userId: userDocId,
    badgeId,
    tier,
    earnedAt: new Date(),
    hidden: false
  };
  const saved = await wixData.save('UserBadges', badgeEntry);

  // 5. XP drop ausführen, falls >0
  let xpResult = null;
  if (xpAward > 0) {
    xpResult = await addXp(memberId, xpAward, `Badge: ${badgeDef.name}`, { badgeId, tier });
  }

  return { success: true, newTier: tier, xpAwarded: xpResult?.xpAwarded || 0 };
}

/**
 * Usage-Beispiel:
 *
 * import { awardBadge } from 'backend/services/badgeServiceUsers.web.js';
 *
 * $w.onReady(async () => {
 *   const result = await awardBadge(wixUsers.currentUser.id, 'badgeDef123', 2);
 *   console.log(result);
 * });
 */
