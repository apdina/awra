"use client";

import { useEffect, useState } from 'react';

interface HtmlProps {
  locale: string;
  children: React.ReactNode;
}

export function HtmlWrapper({ locale, children }: HtmlProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <html lang={isClient ? locale : locale} className="dark">
      {children}
    </html>
  );
}
