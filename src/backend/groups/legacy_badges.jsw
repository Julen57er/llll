/****************************************************************
 * LuxeLink – Backend | groups/badges.jsw
 ****************************************************************/

import wixData from 'wix-data';

export async function awardGroupBadge(groupId,badgeId,logReason){
  const exists = await wixData.query('GroupVerdienteBadges')
                  .eq('groupRef',groupId).eq('badgeId_ref',badgeId).count();
  if (exists) return false;

  await wixData.insert('GroupVerdienteBadges',
      { groupRef:groupId, badgeId_ref:badgeId },{suppressAuth:true});

  await wixData.insert('XPLog',
      { groupRef:groupId, xpDelta:0, reasonLabel:logReason},{suppressAuth:true});
  return true;
}
