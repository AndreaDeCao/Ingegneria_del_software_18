// import Turnstile from "react-turnstile";


// type Props = {
//   onVerify: (token: string) => void;
//   onExpire?: () => void; // onExpire è opzionale, se non viene passato non facciamo nulla quando il CAPTCHA scade o quando l'utente sbaglia le credenziali dell'autenticazione e il token del CAPTCHA diventa invalido. In questo modo evitiamo di mostrare un messaggio di errore relativo al CAPTCHA in situazioni in cui l'utente non ha ancora interagito con il widget o quando il token è scaduto ma l'utente non ha ancora tentato di inviare il form.
// };

// export default function TurnstileWidget({ onVerify, onExpire }: Props) {
//   return (
//     <div style={{ marginTop: 12 }}>
//       <Turnstile
//         sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
//         onVerify={(token) => onVerify(token)}
//         onExpire={() => onExpire?.()}
//       />
//     </div>
//   );
// }

import { useEffect } from "react";

declare global {
  interface Window {
    turnstile: any;
  }
}

type Props = {
  onVerify: (token: string) => void;
  onExpire?: () => void; // onExpire è opzionale, se non viene passato non facciamo nulla quando il CAPTCHA scade o quando l'utente sbaglia le credenziali dell'autenticazione e il token del CAPTCHA diventa invalido. In questo modo evitiamo di mostrare un messaggio di errore relativo al CAPTCHA in situazioni in cui l'utente non ha ancora interagito con il widget o quando il token è scaduto ma l'utente non ha ancora tentato di inviare il form.
};

export default function TurnstileWidget({ onVerify }: Props) {
  useEffect(() => {
    if (!window.turnstile) return;

    window.turnstile.render("#turnstile-container", {
      sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
      callback: (token: string) => {
        onVerify(token);
      },
    });
  }, []);

  return <div id="turnstile-container" style={{ marginTop: 12 }} />;
}