import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopAppBar />
      <main className="min-h-screen pt-14 pb-20 px-6">
        {children}
      </main>
      <BottomNavBar />
    </>
  );
}
