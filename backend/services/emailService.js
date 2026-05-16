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

module.exports = { sendVerificationEmail };