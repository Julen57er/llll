// File: backend/dataHooks/xpLogUsers.js

import wixData from 'wix-data';

/**
 * beforeInsert Hook für XPLogUsers
 * ---------------------------------
 * Validiert das Schema des neuen XPLogUsers-Eintrags.
 * Stellt sicher, dass alle Pflichtfelder vorhanden sind.
 *
 * @param {{ userId: string, delta: number, reason: string, timestamp: Date }} item
 * @param {import('wix-data').HookContext} context
 * @returns {object} das validierte Item
 * @throws {Error} wenn ein Pflichtfeld fehlt
 */
export function beforeInsert(item, context) {
  const requiredFields = ['userId', 'delta', 'reason', 'timestamp'];
  for (const field of requiredFields) {
    if (item[field] === undefined || item[field] === null) {
      // Hier wurde das unnötige Escape-Zeichen entfernt:
      throw new Error(`XPLogUsers beforeInsert: Pflichtfeld "${field}" fehlt.`);
    }
  }
  return item;
}

/**
 * afterInsert Hook für XPLogUsers
 * --------------------------------
 * Wird nach dem Einfügen in XPLogUsers ausgeführt.
 * Hier kann die Neuberechnung von UserXP (Level, Streak, TotalXP) 
 * im zugehörigen UserXP-Dokument angestoßen werden.
 *
 * @param {{ _id: string, userId: string, delta: number, reason: string, timestamp: Date }} item
 * @param {import('wix-data').HookContext} context
 */
export async function afterInsert(item, context) {
  // TODO: Recalculate UserXP stats für item.userId
  // Beispiel:
  // const record = await wixData.get('UserXP', item.userId);
  // record.totalXp = /* neue Summe */;
  // await wixData.update('UserXP', record);
}
