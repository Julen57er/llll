/*****************************************************************
 * Admin-Historie   –   zeigt alle Approve/Decline-Logs
 *   (ohne Datumsfilter, ohne onPageSizeChanged)
 *****************************************************************/

const DS   = '#historyDataset';
const INFO = '#infoText';

$w.onReady(() => {

  /* Sobald das Dataset fertig ist → Info-Text setzen */
  $w(DS).onReady(() => {
    const count = $w(DS).getTotalCount();   // sofortige Zahl
    $w(INFO).text = count
      ? ''                                   // Liste nicht leer
      : 'Keine Einträge in der Historie.';
  });
});
