/*************************************************************
 *  LuxeLink – Backend | auth/register.jsw
 *  -----------------------------------------------------------
 *  Server-seitige Registrierung:
 *   • erzeugt Wix-Member + SendGrid-Bestätigung
 *   • legt Import414-Profil an (Status = 'Pending')
 *   • gibt strukturiertes Ergebnis zurück
 *************************************************************/

import wixUsersBackend      from 'wix-users-backend';
import wixData              from 'wix-data';
import { triggeredEmails }  from 'wix-crm-backend';
import { assignRole }       from 'backend/auth/roles.web';   // interne Rolle

const COLL_IMPORT = 'Import414';
const VERIFY_MAIL = 'REG_MAIL_TEMPLATE_ID';             // optional

export async function registerMember({ email, password, nickname,
                                       firstName = '', lastName = '' }) {

  if (!email || !password || !nickname)
    throw new Error('MISSING_FIELDS');

  /* 1 - Wix-Member anlegen */
  const member = await wixUsersBackend.register(email, password, {
                    contactInfo: { firstName, lastName }
                  }).catch(e => {
                    if (e.code === 'EmailAlreadyExists') throw new Error('EMAIL_EXISTS');
                    throw e;
                  });

  const memberId = member.id;

  /* 2 - Import414-Profil erstellen (Status Pending) */
  await wixData.insert(COLL_IMPORT, {
    memberId,
    nickname,
    firstName,
    lastName,
    role      : 'Mitglied',
    status    : 'Pending',
    xp        : 0,
    level     : 1,
    createdAt : new Date()
  });

  /* 3 - Default-Rolle zuweisen */
  await assignRole(memberId, 'Mitglied').catch(() => {/* ignore */});

  /* 4 - Optionales Welcome-Mail */
  if (VERIFY_MAIL)
    triggeredEmails.emailMember(VERIFY_MAIL, memberId).catch(() => {/* ignore */});

  return { ok: true, memberId };
}
