import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/auth/session";
import { getOrganization } from "@/lib/org";
import { ROLE_LABELS } from "@/lib/labels";
import { ReadOnlyNotice } from "@/components/layout/read-only-notice";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser(["OWNER", "ADMIN", "VIEWER"]);
  const org = await getOrganization();

  return (
    <SidebarProvider>
      <AppSidebar
        brandName={org.brandName}
        logoUrl={org.logoUrl}
        user={{
          name: session.name,
          email: session.email,
          role: session.role,
        }}
        isPremiumPlan={org.plan === "PREMIUM"}
      />
      <SidebarInset>
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <span className="text-muted-foreground truncate text-sm">
            {org.name}
          </span>
          <span className="text-muted-foreground/60 ml-auto hidden text-xs sm:inline">
            {ROLE_LABELS[session.role]}
          </span>
        </header>

        {session.role === "VIEWER" ? <ReadOnlyNotice /> : null}

        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
