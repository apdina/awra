"use client";

import { useEffect, useState } from 'react';

export default function GoogleOAuthDebug() {
  const [info, setInfo] = useState({
    origin: '',
    hostname: '',
    port: '',
    protocol: '',
    href: '',
    clientId: '',
  });

  useEffect(() => {
    setInfo({
      origin: window.location.origin,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      href: window.location.href,
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'NOT SET',
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-yellow-500 rounded-lg p-4 text-xs text-white max-w-md z-50">
      <h3 className="font-bold text-yellow-500 mb-2">Google OAuth Debug Info</h3>
      <div className="space-y-1">
        <div><span className="text-gray-400">Origin:</span> <span className="text-green-400">{info.origin}</span></div>
        <div><span className="text-gray-400">Hostname:</span> <span className="text-green-400">{info.hostname}</span></div>
        <div><span className="text-gray-400">Port:</span> <span className="text-green-400">{info.port || 'default'}</span></div>
        <div><span className="text-gray-400">Protocol:</span> <span className="text-green-400">{info.protocol}</span></div>
        <div><span className="text-gray-400">Client ID:</span> <span className="text-green-400 break-all">{info.clientId}</span></div>
      </div>
      <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-500/50 rounded">
        <p className="text-yellow-400 font-semibold">Required in Google Console:</p>
        <p className="text-white break-all">{info.origin}</p>
      </div>
    </div>
  );
}
