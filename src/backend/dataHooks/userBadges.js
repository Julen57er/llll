// File: backend/dataHooks/userBadges.js

import wixData from 'wix-data';

/**
 * beforeInsert Hook für UserBadges
 * --------------------------------
 * Verhindert Doppelvergabe desselben Badges und handhabt Tier-Upgrades.
 * Bei erstem Verleih wird ein neuer Eintrag erstellt.
 * Bei höherem Tier wird der bestehende Eintrag upgedatet.
 *
 * @param {{ 
 *   _id?: string,
 *   userId: string, 
 *   badgeId: string, 
 *   tier: number, 
 *   earnedAt?: Date, 
 *   hidden?: boolean 
 * }} item
 * @param {import('wix-data').HookContext} context
 * @returns {object} das validierte bzw. modifizierte Item
 * @throws {Error} wenn Pflichtfelder fehlen oder das Tier nicht gesteigert wird
 */
export async function beforeInsert(item, context) {
  // 1. Pflichtfelder prüfen
  if (!item.userId) {
    throw new Error('Feld "userId" ist erforderlich.');
  }
  if (!item.badgeId) {
    throw new Error('Feld "badgeId" ist erforderlich.');
  }
  if (typeof item.tier !== 'number') {
    throw new Error('Feld "tier" muss eine Zahl sein.');
  }

  // 2. Existierendes Badge abfragen
  const existingRes = await wixData.query('UserBadges')
    .eq('userId', item.userId)
    .eq('badgeId', item.badgeId)
    .find();

  if (existingRes.items.length > 0) {
    const existing = existingRes.items[0];
    // Nur Tier-Upgrades erlauben
    if (item.tier <= existing.tier) {
      throw new Error('Badge bereits vergeben mit gleichem oder höherem Tier.');
    }
    // Upsert: statt neuer Insert, update des vorhandenen Dokuments
    item._id = existing._id;
  }

  // 3. earnedAt initialisieren, falls nicht gesetzt
  if (!(item.earnedAt instanceof Date)) {
    item.earnedAt = new Date();
  }

  // 4. hidden default auf false
  if (typeof item.hidden !== 'boolean') {
    item.hidden = false;
  }

  return item;
}
