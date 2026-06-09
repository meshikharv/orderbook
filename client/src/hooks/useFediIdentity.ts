import { useState, useEffect } from 'react';

// TODO: Confirm exact Fedi Mini App injection method with Fedi team. See https://docs.fedi.xyz

const STORAGE_KEY = 'fedi_npub';

export type IdentityState =
  | { status: 'loading' }
  | { status: 'resolved'; npub: string }
  | { status: 'mobile_no_fedi' }
  | { status: 'desktop_prompt' };

function isMobileWebView(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return /android|iphone|ipad|ipod|mobile/.test(ua) && !/chrome\/\d{2,}/.test(ua);
}

function isValidNpub(val: string): boolean {
  return typeof val === 'string' && val.startsWith('npub1') && val.length >= 60;
}

export function useFediIdentity() {
  const [state, setState] = useState<IdentityState>({ status: 'loading' });
  const [npub, setNpubState] = useState<string | null>(null);

  useEffect(() => {
    let detected: string | null = null;

    // Method 1 — URL query param
    try {
      const params = new URLSearchParams(window.location.search);
      const qp = params.get('npub');
      if (qp && isValidNpub(qp)) {
        detected = qp;
      }
    } catch { /* ignore */ }

    // Method 2 — Fedi JS bridge
    // TODO: Confirm exact Fedi Mini App injection method with Fedi team. See https://docs.fedi.xyz
    if (!detected) {
      try {
        const fedi = (window as any).fedi;
        if (fedi) {
          const bridgeNpub = fedi.npub || fedi.getUser?.()?.npub;
          if (bridgeNpub && isValidNpub(bridgeNpub)) {
            detected = bridgeNpub;
          }
        }
      } catch { /* bridge not available outside Fedi */ }
    }

    // Method 3 — localStorage cache
    if (!detected) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached && isValidNpub(cached)) {
          detected = cached;
        }
      } catch { /* ignore */ }
    }

    if (detected) {
      try { localStorage.setItem(STORAGE_KEY, detected); } catch { /* ignore */ }
      setNpubState(detected);
      setState({ status: 'resolved', npub: detected });
      return;
    }

    if (isMobileWebView()) {
      setState({ status: 'mobile_no_fedi' });
    } else {
      setState({ status: 'desktop_prompt' });
    }
  }, []);

  function resolveManualNpub(manualNpub: string) {
    if (!isValidNpub(manualNpub)) return false;
    try { localStorage.setItem(STORAGE_KEY, manualNpub); } catch { /* ignore */ }
    setNpubState(manualNpub);
    setState({ status: 'resolved', npub: manualNpub });
    return true;
  }

  function clearIdentity() {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setNpubState(null);
    setState({ status: 'desktop_prompt' });
  }

  function getFediUsername(): string | null {
    // TODO: Confirm exact Fedi Mini App injection method with Fedi team. See https://docs.fedi.xyz
    try {
      return (window as any).fedi?.getUser?.()?.username ?? null;
    } catch {
      return null;
    }
  }

  return { state, npub, resolveManualNpub, clearIdentity, getFediUsername };
}
