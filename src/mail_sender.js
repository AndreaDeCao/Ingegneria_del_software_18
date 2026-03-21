//per le ipendenze
//<npm install nodemailer crypto

//=======================Azione di Registrazione===========================
// Quando l'utente si registra, chiamiamo questa funzione per inviare la mail di conferma

const nodemailer = require('nodemailer');
const crypto = require('crypto');

// function sendEmail() {
//     // Recupera i valori dei campi del modulo
//     const name = document.getElementById('name').value;
//     const email = document.getElementById('email').value;

// }

async function inviaMailConferma(userEmail) {

    // Genero un token univoco
    const token = crypto.randomBytes(32).toString('hex');
    const scadenza = Date.now() + 3600000; // Il token scade tra 1 ora

    // salvo nel DB: Qui è da salvare 'token' e 'scadenza' nel profilo dell'utente
    // Esempio: await db.users.update({ email: userEmail }, { verificationToken: token, tokenExpiry: scadenza });

    // Configuro il trasportatore (Bisogna usare i dati del provider scelto: Gmail, SendGrid, Mailtrap)
    // ITEGRARE USANDO Mailtrap --> è un finto server SMTP che intercetta le mail che inviamo dal codice e le mostra in una dashboard, senza inviarle davvero a indirizzi reali
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Esempio con Gmail
        auth: {
            user: 'mail@gmail.com',     // ricavare la mail inserita da ux
            pass: 'password' // ricavare la password inserita da ux (per Gmail, è necessario creare una password per app specifica)
        }
    });

    const urlVerifica = `http://localhost:3000/verify-email?token=${token}`;    //se implementeremo docker e il backend sarà su un altro dominio, bisognerà aggiornare questo URL con quello corretto (es: http://tuosito.it/verify-email?token=${token})

    // Invio la mail
    await transporter.sendMail({
        from: '"Il Tuo Sito" <no-reply@tuosito.it>',
        to: userEmail,
        subject: "Conferma la tua registrazione",
        html: `<b>Benvenuto!</b><p>Clicca sul link per confermare il tuo account: <a href="${urlVerifica}">Verifica Account</a></p>`
    });
}


//=======================Ricevitore del Click di verifica===========================
// Quando l'utente clicca sul link di verifica, questa funzione è sempre in ascolto perricevere e validare la richiesta dell'utente

const express = require('express');
const app = express();

app.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    // Cerco l'utente nel database tramite il token
    // const user = await db.users.findOne({ verificationToken: token });   // Esempio di ricerca dell'utente tramite token

  
    if (!user) { 
        return res.status(400).send("Token non valido.");   // Se non troviamo un utente con quel token, è un token non valido
    }

    // Controllo se il token è scaduto
    if (Date.now() > user.tokenExpiry) {
        return res.status(400).send("Il link di verifica è scaduto."); // Se il token è scaduto, informiamo l'utente che deve richiedere un nuovo link di verifica
    }

    // Esempio di aggiornamento dello stato dell'utente
    // user.isVerified = true;
    // user.verificationToken = null; // Rimuovo il token usato
    // await user.save();

    res.send("Email verificata con successo! Ora puoi effettuare il login.");
});