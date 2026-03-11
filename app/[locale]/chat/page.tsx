import { Suspense } from "react";
import ChatPageContent from "./ChatPageContent";

export default function ChatPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Loading chat...</div></div>}>
      <ChatPageWrapper params={params} />
    </Suspense>
  );
}

async function ChatPageWrapper({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <ChatPageContent locale={locale} />;
}
