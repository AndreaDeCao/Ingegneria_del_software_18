import { useEffect } from "react";

declare global {
  interface Window {
    turnstile: any;
  }
}

type Props = {
  onVerify: (token: string) => void;
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