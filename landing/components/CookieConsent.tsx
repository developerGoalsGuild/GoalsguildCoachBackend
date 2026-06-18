"use client";

import { useState } from "react";

export function CookieConsent() {
  const [accepted, setAccepted] = useState(false);
  if (accepted) return null;
  return (
    <div className="cookie">
      <span>We use essential cookies for checkout and license/security flows.</span>
      <button onClick={() => setAccepted(true)}>OK</button>
    </div>
  );
}
