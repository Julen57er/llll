// File: backend/dataHooks/xpLogGroups.js

import wixData from 'wix-data';

/**
 * beforeInsert Hook für XPLogGroups
 * ---------------------------------
 * Validiert das Schema des neuen XPLogGroups-Eintrags.
 * Stellt sicher, dass alle Pflichtfelder vorhanden sind.
 *
 * @param {{ groupId: string, delta: number, reason: string, timestamp: Date }} item
 * @param {import('wix-data').HookContext} context
 * @returns {object} das validierte / angereicherte Item
 * @throws {Error} bei fehlenden Pflichtfeldern
 */
export function beforeInsert(item, context) {
  const requiredFields = ['groupId', 'delta', 'reason', 'timestamp'];
  for (const field of requiredFields) {
    if (item[field] === undefined || item[field] === null) {
      throw new Error(`XPLogGroups beforeInsert: Pflichtfeld "${field}" fehlt.`);
    }
  }
  return item;
}

/**
 * afterInsert Hook für XPLogGroups
 * --------------------------------
 * Wird _nach_ dem Einfügen in XPLogGroups ausgeführt.
 * Hier sollte die Neuberechnung von GroupXP (TotalXP, Level, Overflow) 
 * im zugehörigen GroupXP-Dokument angestoßen werden.
 *
 * @param {{ _id: string, groupId: string, delta: number, reason: string, timestamp: Date }} item
 * @param {import('wix-data').HookContext} context
 */
export async function afterInsert(item, context) {
  // TODO: Recalculate GroupXP stats (TotalXP, Level, Overflow) für item.groupId
  // Beispiel:
  // const record = await wixData.get('GroupXP', item.groupId);
  // record.totalXp = /* neue Summe */;
  // record.overflowXp = /* neuer Overflow */;
  // await wixData.update('GroupXP', record);
}
