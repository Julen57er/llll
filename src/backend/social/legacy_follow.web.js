/*****************************************************************
 *  backend/social/follow.web.js
 *  --------------------------------------------------------------
 *  toggleFollow(targetMemberId)
 *    • wenn Viewer nicht eingeloggt → Error
 *    • existiert schon ein Follow →  löscht ihn   (Unfollow)
 *    • existiert keiner          →  legt neuen an (Follow)
 *    • liefert { following: true|false, totalFollowers }
 *****************************************************************/
import wixData            from 'wix-data';
import wixUsersBackend    from 'wix-users-backend';

const COLL = 'Follows';

export async function toggleFollow(targetMemberId) {

  /* 1 · Viewer ermitteln */
  const viewer = wixUsersBackend.currentUser;
  if (!viewer.loggedIn) throw new Error('NOT_LOGGED_IN');
  const viewerId = viewer.id;

  if (viewerId === targetMemberId) throw new Error('SELF_FOLLOW_FORBIDDEN');

  /* 2 · Prüfen, ob bereits Follow-Dokument existiert */
  const followKey = `${viewerId}_${targetMemberId}`;   // eindeutige _id
  const has = await wixData.get(COLL, followKey).catch(() => null);

  let following;
  if (has) {
    /* 3a · Unfollow */
    await wixData.remove(COLL, followKey);
    following = false;
  } else {
    /* 3b · Follow */
    await wixData.insert(COLL, {
      _id       : followKey,
      followerId: viewerId,
      targetId  : targetMemberId
    });
    following = true;
  }

  /* 4 · neuen Follower-Zähler holen */
  const totalFollowers = await wixData
        .query(COLL)
        .eq('targetId', targetMemberId)
        .count();

  return { following, totalFollowers };
}
