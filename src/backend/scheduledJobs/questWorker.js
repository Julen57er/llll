// questWorker.js
// Geplanter Job (.js) für Wix Studio / Velo: Rollout & Reset von Daily/Weekly/Monthly-Quests

import wixData from 'wix-data';
import { addXp as addUserXp } from 'backend/services/xpServiceUsers.web.js';
import { awardBadge as awardUserBadge } from 'backend/services/badgeServiceUsers.web.js';

/**
 * scheduledQuestsJob
 * ------------------
 * Läuft täglich via Wix Scheduled Jobs.
 *
 * 1. Vergibt Quest-Abschluss-XP an Nutzer, die ihr Ziel erreicht haben.
 * 2. Optional: vergibt zugehöriges Badge.
 * 3. Setzt QuestProgressUsers.current = 0 und periodStart auf neuen Zyklus.
 * 4. Initialisiert neue QuestProgressUsers-Einträge für alle aktiven Nutzer und alle Quests.
 *
 * @returns {Promise<void>}
 */
export async function scheduledQuestsJob() {
  const now = new Date();

  // 1. Alle Quest-Definitionen abfragen
  const questDefsRes = await wixData.query('QuestDef').find();
  const questDefs = questDefsRes.items;

  // 2. Für jede QuestDef:
  for (const quest of questDefs) {
    // Berechnung des neuen periodStart je nach quest.period
    let nextPeriodStart = new Date();
    switch (quest.period) {
      case 'Daily':
        nextPeriodStart.setHours(0, 0, 0, 0);
        break;
      case 'Weekly':
        // Setze auf letzten Montag
        nextPeriodStart.setDate(nextPeriodStart.getDate() - ((nextPeriodStart.getDay() + 6) % 7));
        nextPeriodStart.setHours(0, 0, 0, 0);
        break;
      case 'Monthly':
        nextPeriodStart.setDate(1);
        nextPeriodStart.setHours(0, 0, 0, 0);
        break;
      default:
        continue;
    }

    // 3. QuestProgressUsers für diese Quest ermitteln
    const progressRes = await wixData.query('QuestProgressUsers')
      .eq('questId', quest._id)
      .find();
    const progresses = progressRes.items;

    // 4. Abschließen & Reset
    for (const prog of progresses) {
      if (prog.current >= prog.target) {
        // a) XP auszahlen
        await addUserXp(prog.userId, quest.xpRewardUser, `Quest Complete: ${quest.name}`, { questId: quest._id });
        // b) Badge vergeben
        if (quest.badgeId) {
          await awardUserBadge(undefined, quest.badgeId, 0); // Badge-Service erwartet memberId; intern dann prog.userId
        }
      }
      // c) Reset des Fortschritts
      prog.current = 0;
      prog.periodStart = nextPeriodStart;
      await wixData.update('QuestProgressUsers', prog);
    }

    // 5. Neue Einträge für Nutzer ohne Fortschritt
    //    (Optional: nur für aktive Nutzer/Mitglieder)
    //    Beispiel: alle Nutzer abrufen, dann für jeden prüfen und ggf. insert
    // TODO: Implementierung der Initialisierung neuer Einträge
  }
}

/**
 * Hinweis:
 * - Dieses Skript wird über die Wix Scheduled Jobs-Konfiguration täglich ausgeführt.
 * - Stelle sicher, dass du ggf. eine Filterung auf aktive Nutzer ergänzt.
 */
