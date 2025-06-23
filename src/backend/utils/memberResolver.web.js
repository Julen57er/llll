// memberResolver.web.js
// Modernes Webmodul (.web.js) für Wix Studio / Velo

// Import des Wix Data API-Moduls
import wixData from 'wix-data';

/**
 * resolveMemberDocId
 * ------------------
 * Wandelt die von Wix übergebene memberId in die interne _id
 * deiner eigenen Members-Collection (Import414) um.
 *
 * @param {string} memberId  - Die Wix Users API ID des Nutzers
 * @returns {Promise<string>} - Das _id-Feld des gefundenen Import414-Dokuments
 * @throws {Error}         - Falls kein Eintrag zu dieser memberId existiert
 */
export async function resolveMemberDocId(memberId) {
  // 1. Query auf die Import414-Collection
  const queryResult = await wixData.query('Import414')
    .eq('memberId', memberId)   // Filter auf das Feld memberId
    .limit(1)                   // Nur ein Ergebnis benötigt
    .find();

  // 2. Prüfung, ob ein Dokument gefunden wurde
  if (!queryResult.items || queryResult.items.length === 0) {
    // Fehlermeldung mit konkreter memberId für Debugging
    throw new Error(`Import414: Kein Eintrag für memberId "${memberId}" gefunden.`);
  }

  // 3. Rückgabe der internen _id des Member-Dokuments
  return queryResult.items[0]._id;
}

/**
 * Beispiel-Usage (in anderen Webmodulen oder Front-End-Code):
 *
 * import { resolveMemberDocId } from 'backend/utils/memberResolver.web.js';
 *
 * // Innerhalb einer async-Funktion:
 * const userDocId = await resolveMemberDocId(wixUsers.currentUser.id);
 */
