import Sidebar from "@/components/Sidebar";
import StatusBar from "@/components/StatusBar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <StatusBar />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
