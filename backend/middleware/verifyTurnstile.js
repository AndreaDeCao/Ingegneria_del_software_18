const axios = require("axios");

const verifyTurnstile = async (req, res, next) => {
  console.log("BODY RECEIVED:", req.body);
console.log("TOKEN:", req.body.turnstileToken);
  try {
    const token = req.body.turnstileToken;

    if (!token) {
      return res.status(400).json({ error: "Turnstile token mancante" });
    }

    const formData = new URLSearchParams();
    formData.append("secret", process.env.TURNSTILE_SECRET_KEY);
    formData.append("response", token);

    const response = await axios.post(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    if (!response.data.success) {
      return res.status(403).json({ error: "CAPTCHA non valido" });
    }    
    next();
  } catch (err) {
    return res.status(500).json({ error: "Errore verifica CAPTCHA" });
}

};

module.exports = verifyTurnstile;