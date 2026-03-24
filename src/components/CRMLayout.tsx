import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { StarField } from "@/components/StarField";

interface CRMLayoutProps {
  children: React.ReactNode;
}

export function CRMLayout({ children }: CRMLayoutProps) {
  return (
    <SidebarProvider>
      {/* Fixed star field — behind all UI, visible through transparent gaps */}
      <StarField />

      {/* Main layout — z-index 1 keeps content above stars */}
      <div className="min-h-screen flex w-full relative" style={{ zIndex: 1 }}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
