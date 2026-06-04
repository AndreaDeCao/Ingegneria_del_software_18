const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

/**
 * Manda la mail di verifica email all'utente appena registrato
 * @param {string} toEmail - indirizzo email del destinatario
 * @param {string} token - token di verifica generato durante la registrazione
 */
async function sendVerificationEmail(toEmail, token) {
  const baseUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email/${token}`;

  await transporter.sendMail({
    from: `"DoloMate" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Verifica il tuo account DoloMate",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Benvenuto su DoloMate!</h2>
        <p>Clicca il pulsante qui sotto per verificare il tuo account.</p>
        <p>Il link scade tra <strong>24 ore</strong>.</p>
        <a href="${verifyUrl}" 
           style="display:inline-block; padding:12px 24px; background:#2563eb;
                  color:white; border-radius:6px; text-decoration:none; font-weight:bold;">
          Verifica account
        </a>
        <p style="margin-top:24px; color:#888; font-size:12px;">
          Se non hai creato un account su DoloMate, ignora questa mail.
        </p>
      </div>
    `,
  });
}


/**
 * Manda mail di conferma per il cambio email di un utente già registrato.
 * 
 * @param {string} toEmail - nuovo indirizzo email da verificare
 * @param {string} token - token di verifica del cambio email
 */
async function sendEmailChangeVerification(toEmail, token) {
  const baseUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/users/verify-email-change/${token}`;

  await transporter.sendMail({
      from: `"DoloMate" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: "Conferma il cambio email su DoloMate",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
          <h2>Richiesta cambio email</h2>
          <p>Hai richiesto di associare questo indirizzo email al tuo account DoloMate.</p>
          <p>Clicca il pulsante qui sotto per confermare il cambio. Il link scade tra <strong>24 ore</strong>.</p>
          <a href="${verifyUrl}" 
            style="display:inline-block; padding:12px 24px; background:#2563eb;
                    color:white; border-radius:6px; text-decoration:none; font-weight:bold;">
            Conferma nuova email
          </a>
          <p style="margin-top:24px; color:#888; font-size:12px;">
            Se non hai richiesto tu questa modifica, ignora questa mail.
          </p>
        </div>
      `,
    });
}


async function sendTemporaryPasswordEmail(toEmail, tempPassword) {
  await transporter.sendMail({
    from: `"DoloMate" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Password temporanea DoloMate",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Richiesta password temporanea</h2>
        <p>Abbiamo ricevuto una richiesta di password temporanea per il tuo account.</p>
        <p>Usa questa password per accedere:</p>
        <p style="font-size: 18px; font-weight: 700; background: #f3f4f6; padding: 12px; border-radius: 8px;">
          ${tempPassword}
        </p>
        <p>La password è valida per <strong>1 ora</strong>. Dopo l&apos;accesso, ti consigliamo di cambiare la password nelle impostazioni dell&apos;account.</p>
        <p style="margin-top:24px; color:#888; font-size:12px;">
          Se non hai richiesto questa password, ignora questa mail.
        </p>
      </div>
    `,
  });
}

// module.exports = { sendVerificationEmail, sendTemporaryPasswordEmail };

module.exports = { sendVerificationEmail, sendEmailChangeVerification, sendTemporaryPasswordEmail };