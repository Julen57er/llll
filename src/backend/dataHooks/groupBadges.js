// File: backend/dataHooks/groupBadges.js

import wixData from 'wix-data';

/**
 * beforeInsert Hook für GroupBadges
 * ---------------------------------
 * Verhindert Doppelvergabe desselben Badges an Gruppen und handhabt Tier-Upgrades.
 *
 * @param {{
 *   _id?: string,
 *   groupId: string,
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
  if (!item.groupId) {
    throw new Error('Feld "groupId" ist erforderlich.');
  }
  if (!item.badgeId) {
    throw new Error('Feld "badgeId" ist erforderlich.');
  }
  if (typeof item.tier !== 'number') {
    throw new Error('Feld "tier" muss eine Zahl sein.');
  }

  // 2. Existierendes Badge abfragen
  const existingRes = await wixData.query('GroupBadges')
    .eq('groupId', item.groupId)
    .eq('badgeId', item.badgeId)
    .find();

  if (existingRes.items.length > 0) {
    const existing = existingRes.items[0];
    // Nur Tier-Upgrades erlauben
    if (item.tier <= existing.tier) {
      throw new Error('Badge bereits an diese Gruppe vergeben mit gleichem oder höherem Tier.');
    }
    // Upsert: Update des vorhandenen Dokuments statt neuer Insert
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
