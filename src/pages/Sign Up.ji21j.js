import { registerUser } from 'backend/register';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

const REDIRECT_URL = '/llll/get-started';

$w.onReady(() => {
  $w('#errorMsg, #successMessage').hide();
  $w('#buttonRegister').onClick(doRegister);
});

async function doRegister() {
  const nickname       = $w('#inputNickname').value.trim();
  const firstName      = $w('#inputFirstName').value.trim();
  const lastName       = $w('#inputLastName').value.trim();
  const email          = $w('#inputEmail').value.trim();
  const pw             = $w('#inputPassword').value;
  const pw2            = $w('#inputPasswordConfirm').value;

  if (!nickname || !firstName || !lastName || !email || !pw || !pw2) {
    return showError('Bitte alle Pflichtfelder ausfüllen.');
  }
  if (pw !== pw2) return showError('Passwörter stimmen nicht überein.');
  if (!$w('#checkboxTerms').checked) return showError('AGB akzeptieren.');
  if (!$w('#reCaptcha').token) return showError('Bitte Captcha bestätigen.');

  /* optionale Felder */
  const company        = $w('#inputCompany').value;
  const specialization = $w('#inputSpecialization').value;
  const newsletter     = $w('#checkboxNewsletter').checked;

  $w('#buttonRegister').disable().label = 'Bitte warten …';

  try {
    const res = await registerUser({
      nickname,
      firstName,
      lastName,
      email,
      password: pw,
      company,
      specialization,
      newsletter
    });

    if (!res.success) return showError(res.message || 'Registrierung fehlgeschlagen.');
    await wixUsers.login(email, pw);
    wixLocation.to(REDIRECT_URL);

  } catch (err) {
    showError('Fehler: ' + err.message);
    console.error(err);
  } finally {
    $w('#buttonRegister').enable().label = 'Create Account';
  }
}

function showError(msg) {
  $w('#errorMsg').text = msg;
  $w('#errorMsg').show();
  $w('#successMessage').hide();
}
