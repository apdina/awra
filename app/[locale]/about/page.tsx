import { Suspense } from "react";
import { NotificationProvider } from "@/app/contexts/NotificationContext";
import AboutContent from "./AboutContent";

export default function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotificationProvider>
        <AboutContent />
      </NotificationProvider>
    </Suspense>
  );
}
