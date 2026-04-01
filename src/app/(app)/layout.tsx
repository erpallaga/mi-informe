import TopAppBar from "@/components/layout/TopAppBar";
import AppNav from "@/components/layout/AppNav";
import PageTransition from "@/components/layout/PageTransition";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopAppBar />
      <main className="min-h-screen pt-14 pb-[calc(4rem_+_env(safe-area-inset-bottom))] px-6">
        <PageTransition>{children}</PageTransition>
      </main>
      <AppNav />
    </>
  );
}
