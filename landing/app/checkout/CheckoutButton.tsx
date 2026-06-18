"use client";

import { normalizeLicenseApiUrl } from "../../lib/licenseApiUrl";

export function CheckoutButton() {
  return (
    <button 
      onClick={() => {
        const rawApiUrl = process.env.NEXT_PUBLIC_LICENSE_API_URL;
        if (rawApiUrl) {
          const apiUrl = normalizeLicenseApiUrl(rawApiUrl);
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = `${apiUrl}/checkout`;
          document.body.appendChild(form);
          form.submit();
        } else {
          alert("API URL not configured.");
        }
      }} 
      className="btn btn-primary"
    >
      Continue to Secure Payment
    </button>
  );
}