// gamificationGateway.web.js
// Modernes Webmodul (.web.js) für zentrale Gamification-Entry-Points

// Imports der Service-Funktionen
import { resolveMemberDocId } from 'backend/utils/memberResolver.web.js';
import { addXp as addUserXp } from 'backend/services/xpServiceUsers.web.js';
import { addXp as addGroupXp } from 'backend/services/xpServiceGroups.web.js';
import { awardBadge as awardUserBadge } from 'backend/services/badgeServiceUsers.web.js';
import { awardBadge as awardGroupBadge } from 'backend/services/badgeServiceGroups.web.js';
import { updateProgress as updateUserQuestProgress } from 'backend/services/questProgressServiceUsers.web.js';
import { updateProgress as updateGroupQuestProgress } from 'backend/services/questProgressServiceGroups.web.js';
import { joinChallenge as joinUserChallenge, submitChallenge as submitUserChallenge } from 'backend/services/challengeServiceUsers.web.js';
import { joinChallenge as joinGroupChallenge, submitChallenge as submitGroupChallenge } from 'backend/services/challengeServiceGroups.web.js';

/**
 * action
 * ------
 * Zentrale Funktion, um alle Gamification-Aktionen aus dem Front-End
 * bzw. anderen Backend-Modulen zu verteilen.
 *
 * @param {string} type   - Der Aktions-Schlüssel (z.B. "ADD_XP_USER", "COMPLETE_QUEST_GROUP")
 * @param {object} data   - Nutzdaten für die Aktion (z.B. memberId, groupId, delta, reason, questId)
 * @returns {Promise<any>} - Ergebnis der jeweiligen Service-Funktion
 * @throws {Error}       - Bei unbekannter Aktion oder fehlenden Parametern
 */
export async function action(type, data = {}) {
  switch (type) {
    // --- User-XP ---
    case 'ADD_XP_USER': {
      const userDocId = await resolveMemberDocId(data.memberId);
      return addUserXp(userDocId, data.delta, data.reason, data.meta);
    }

    // --- Group-XP ---
    case 'ADD_XP_GROUP':
      return addGroupXp(data.groupId, data.delta, data.reason, data.meta);

    // --- Badges ---
    case 'AWARD_BADGE_USER': {
      const userDocId = await resolveMemberDocId(data.memberId);
      return awardUserBadge(userDocId, data.badgeId, data.tier);
    }
    case 'AWARD_BADGE_GROUP':
      return awardGroupBadge(data.groupId, data.badgeId, data.tier);

    // --- Quests ---
    case 'UPDATE_QUEST_USER': {
      const userDocId = await resolveMemberDocId(data.memberId);
      return updateUserQuestProgress(userDocId, data.questId, data.increment);
    }
    case 'UPDATE_QUEST_GROUP':
      return updateGroupQuestProgress(data.groupId, data.questId, data.increment);

    // --- Challenges ---
    case 'JOIN_CHALLENGE_USER': {
      const userDocId = await resolveMemberDocId(data.memberId);
      return joinUserChallenge(userDocId, data.challengeId);
    }
    case 'JOIN_CHALLENGE_GROUP':
      return joinGroupChallenge(data.groupId, data.challengeId);
    case 'SUBMIT_CHALLENGE_USER': {
      const userDocId = await resolveMemberDocId(data.memberId);
      return submitUserChallenge(userDocId, data.challengeId, data.payload);
    }
    case 'SUBMIT_CHALLENGE_GROUP':
      return submitGroupChallenge(data.groupId, data.challengeId, data.payload);

    default:
      throw new Error(`Unknown gamification action: ${type}`);
  }
}

/**
 * Usage-Beispiele:
 *
 * // Daily Login (User)
 * await action('ADD_XP_USER', { memberId: wixUsers.currentUser.id, delta: 50, reason: 'Daily Login' });
 *
 * // Quest-Fortschritt Gruppe
 * await action('UPDATE_QUEST_GROUP', { groupId: 'xyz123', questId: 'quest456', increment: 1 });
 */
