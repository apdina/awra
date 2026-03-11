import { Suspense } from "react";
import { NotificationProvider } from "@/app/contexts/NotificationContext";
import HowToPlayContent from "./HowToPlayContent";

export default function HowToPlayPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotificationProvider>
        <HowToPlayContent />
      </NotificationProvider>
    </Suspense>
  );
}