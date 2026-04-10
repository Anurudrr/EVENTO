import React, { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID, logMissingEnv } from '../config/env';

declare global {
  interface Window {
    google?: any;
  }
}

type GoogleLoginButtonProps = {
  onCredential: (idToken: string) => Promise<void> | void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
};

const GOOGLE_SCRIPT_ID = 'evento-google-identity';

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onCredential, text = 'continue_with' }) => {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [scriptReady, setScriptReady] = useState(Boolean(window.google?.accounts?.id));
  const clientId = GOOGLE_CLIENT_ID || undefined;

  useEffect(() => {
    if (!clientId) {
      logMissingEnv('VITE_GOOGLE_CLIENT_ID');
    }
  }, [clientId]);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptReady(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }

    buttonRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential?: string }) => {
        if (response.credential) {
          await onCredential(response.credential);
        }
      },
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      text,
      width: 360,
      shape: 'rectangular',
    });
  }, [clientId, onCredential, scriptReady, text]);

  if (!clientId) {
    return (
      <div className="w-full border border-noir-border bg-noir-bg px-6 py-4 text-center text-xs uppercase tracking-widest text-noir-muted">
        Google login unavailable
      </div>
    );
  }

  return <div ref={buttonRef} className="w-full flex justify-center min-h-[44px]" />;
};
