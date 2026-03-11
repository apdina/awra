"use client";

import { Suspense } from "react";
import { NotificationProvider } from "@/app/contexts/NotificationContext";
import PlayContentUnified from "./PlayContentUnified";
import PageWithSidebarAds from "@/components/layout/PageWithSidebarAds";

export default function PlayPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotificationProvider>
        <PageWithSidebarAds>
          <PlayContentUnified />
        </PageWithSidebarAds>
      </NotificationProvider>
    </Suspense>
  );
}
