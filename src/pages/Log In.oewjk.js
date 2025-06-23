import wixUsers    from 'wix-users';
import wixLocation from 'wix-location';

const DASHBOARD_URL = 'https://luxelinkonline.wixstudio.com/llll/dashboard';

/* Fallback-Redirect, wenn Wix reloadet */
wixUsers.onLogin(() => wixLocation.to(DASHBOARD_URL));

$w.onReady(() => {
  $w('#errorMsg, #success').hide();

  $w('#submitLogIn').onClick(doLogin);
  $w('#inputPassword').onKeyPress(e => { if (e.key === 'Enter') doLogin(); });

  $w('#forgotPassword').onClick(async () => {
    const email = $w('#inputEmail').value.trim();
    try {
      await wixUsers.promptForgotPassword(email || undefined);
      showSuccess('Reset-Mail wurde gesendet.');
    } catch (err) {
      showError('Fehler beim Passwort-Reset: ' + err.message);
    }
  });
});

async function doLogin() {
  const email = $w('#inputEmail').value.trim();
  const pw    = $w('#inputPassword').value;

  if (!email || !pw) return showError('Bitte E-Mail und Passwort eingeben.');

  $w('#submitLogIn').disable();
  $w('#submitLogIn').label = 'Bitte warten …';

  try {
    await wixUsers.login(email, pw);
    showSuccess('Erfolgreich eingeloggt …');
    console.log('✅ Login ok – redirecting');
    wixLocation.to(DASHBOARD_URL);         // absolute URL
  } catch (err) {
    showError('Login fehlgeschlagen: ' + err.message);
    console.warn('❌ login error', err);
  } finally {
    $w('#submitLogIn').enable();
    $w('#submitLogIn').label = 'Log In';
  }
}

function showError(m){$w('#errorMsg').text=m;$w('#errorMsg').show();$w('#success').hide();}
function showSuccess(m){$w('#success').text=m;$w('#success').show();$w('#errorMsg').hide();}
