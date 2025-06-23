// seasonService.js
// Geplanter Job (.js) für Wix Studio / Velo: Season-Reset & Prestige-Erhöhung (90-Tage-Rhythmus)

import wixData from 'wix-data';

/**
 * scheduledSeasonJob
 * ------------------
 * Läuft alle 90 Tage via Wix Scheduled Jobs.
 *
 * 1. Halbiert totalXp in UserXP und GroupXP.
 * 2. Erhöht prestige um 1, falls currentLevel ≥ 50.
 * 3. Setzt overflowXp auf 0 zurück.
 * 4. Legt Snapshots in SeasonSnapshot-Collection an (für Analytics).
 *
 * @returns {Promise<void>}
 */
export async function scheduledSeasonJob() {
  // 1. Users bearbeiten
  const userRes = await wixData.query('UserXP').find();
  for (const user of userRes.items) {
    const originalXp = user.totalXp || 0;
    const halvedXp   = Math.floor(originalXp / 2);
    const newPrestige= (user.currentLvl >= 50) ? (user.prestige || 0) + 1 : (user.prestige || 0);

    // Update UserXP
    await wixData.update('UserXP', {
      _id:        user._id,
      totalXp:    halvedXp,
      overflowXp: 0,
      prestige:   newPrestige
    });

    // Snapshot anlegen
    await wixData.insert('SeasonSnapshot', {
      entityType: 'user',
      entityId:   user._id,
      seasonDate: new Date(),
      totalXp:    originalXp,
      prestige:   user.prestige || 0
    });
  }

  // 2. Groups bearbeiten
  const groupRes = await wixData.query('GroupXP').find();
  for (const group of groupRes.items) {
    const originalXp = group.totalXp || 0;
    const halvedXp   = Math.floor(originalXp / 2);
    const newPrestige= (group.currentLvl >= 50) ? (group.prestige || 0) + 1 : (group.prestige || 0);

    // Update GroupXP
    await wixData.update('GroupXP', {
      _id:        group._id,
      totalXp:    halvedXp,
      overflowXp: 0,
      prestige:   newPrestige
    });

    // Snapshot anlegen
    await wixData.insert('SeasonSnapshot', {
      entityType: 'group',
      entityId:   group._id,
      seasonDate: new Date(),
      totalXp:    originalXp,
      prestige:   group.prestige || 0
    });
  }
}

/**
 * Hinweis:
 * - Dieses Skript wird alle 90 Tage über Wix Scheduled Jobs ausgeführt.
 * - Die Collection "SeasonSnapshot" muss zuvor angelegt werden mit Feldern:
 *   entityType (Text), entityId (Reference), seasonDate (Date & Time), totalXp (Number), prestige (Number).
 */