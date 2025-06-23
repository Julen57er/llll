import wixData              from 'wix-data';
import { webMethod, Permissions } from 'wix-web-module';  // NEU

const COLL_PROFILE = 'Import414';
const COLL_FOLLOWS = 'Follows';

/* Hilfsfunktionen dürfen hier bleiben – sie werden nicht exportiert */
async function buildBundle(profile, followerCount, followingCount, viewerFollows, viewerId){
  return {
    profileMain: {
      nickname : profile.nickname,
      firstName: profile.firstName,
      lastName : profile.lastName,
      memberId : profile.memberId
    },
    followerCount,
    followingCount,
    viewerFollows,
    isOwner : viewerId && viewerId === profile.memberId
  };
}

/* EINZIGER Export, korrekt als Web-Method deklariert */
export const getProfileBundle = webMethod(
  Permissions.Any,                      // wer darf aufrufen
  async (profileId, viewerId = null) => {
    if (!profileId) throw new Error('NO_PROFILE_ID');

    const profile = await wixData.get(COLL_PROFILE, profileId).catch(()=>null);
    if (!profile) throw new Error('PROFILE_NOT_FOUND');

    const [ followerCount, followingCount, viewerFollows ] = await Promise.all([
      wixData.query(COLL_FOLLOWS).eq('targetId',   profileId).count(),
      wixData.query(COLL_FOLLOWS).eq('followerId', profileId).count(),
      viewerId
        ? wixData.query(COLL_FOLLOWS)
            .eq('targetId', profileId)
            .eq('followerId', viewerId)
            .count().then(c => c > 0)
        : false
    ]);

    return buildBundle(profile, followerCount, followingCount, viewerFollows, viewerId);
  }
);
