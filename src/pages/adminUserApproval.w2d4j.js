/*****************************************************************
 *  Admin-Freigabe  –  Approve / Decline + Fehlerausgabe im Repeater
 *****************************************************************/

// @ts-ignore  (.jsw-Import ohne Endung)
import { adminSetRole } from 'backend/roles';

const DS   = '#memberDataset';
const INFO = '#infoText';

$w.onReady(() => {

  /* Dataset bereit → Info-Text setzen */
  $w(DS).onReady(refreshInfo);

  /* Repeater-Einträge konfigurieren */
  $w('#repMembers').onItemReady(($item, itemData) => {

    /* Daten anzeigen */
    $item('#txtNick').text  = itemData.nickname || '—';
    $item('#txtEmail').text = itemData.email;
    $item('#ddRole').value  = 'Mitglied';
    $item('#errorMsg').text = '';

    /* Freigeben */
    $item('#btnApprove').onClick(() => {
      action($item, itemData.memberId,
             $item('#ddRole').value, 'Active');
    });

    /* Ablehnen */
    $item('#btnDecline').onClick(() => {
      action($item, itemData.memberId,
             'Mitglied', 'Blocked');
    });
  });
});

/* --------- Aktion ausführen ----------------------------------- */
async function action($item, memberId, role, newStatus) {
  const approveBtn = $item('#btnApprove');
  const declineBtn = $item('#btnDecline');
  const errorFld   = $item('#errorMsg');

  approveBtn.disable(); declineBtn.disable(); errorFld.text = '';

  try {
    const res = await adminSetRole(memberId, role, newStatus);

    if (res.ok) {
      await $w(DS).refresh();
      refreshInfo();
    } else {
      errorFld.text = 'Unbekannte Antwort vom Server.';
    }

  } catch (err) {
    errorFld.text = err.message || 'Aktion fehlgeschlagen.';
  } finally {
    approveBtn.enable(); declineBtn.enable();
  }
}

/* --------- Info-Text ------------------------------------------ */
function refreshInfo() {
  const count = $w(DS).getTotalCount();     // Zahl
  $w(INFO).text = count
    ? ''
    : 'Keine Benutzer warten auf Freigabe.';
}
