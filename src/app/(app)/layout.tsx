import { Nav } from "@/components/nav";
import { SessionNotification } from "@/components/session-notification";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <SessionNotification />
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-6">
        {children}
      </main>
    </>
  );
}
