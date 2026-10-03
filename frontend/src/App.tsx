import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Header } from "@/components/common/Header";
import { ScopeGate } from "@/components/common/ScopeGate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KeyRound, ShieldAlert, CheckCircle2, Lock } from "lucide-react";

export default function App() {
  const { user, fetchMe, activePersona } = useAuthStore();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    fetchMe();
  }, [fetchMe]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="container max-w-screen-xl flex-1 py-8 px-4 sm:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border/80 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs text-muted-foreground">ACTIVE PERSONA</CardDescription>
              <CardTitle className="text-lg font-mono flex items-center justify-between">
                <span>{activePersona.toUpperCase()}</span>
                {user?.is_superuser && (
                  <Badge variant="destructive" className="text-[10px]">SUPERUSER</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono text-muted-foreground">
              {user ? user.email : "Not authenticated (Public Guest)"}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs text-muted-foreground">GRANTED SCOPES (RBAC)</CardDescription>
              <CardTitle className="text-lg font-mono">
                {user?.is_superuser ? "Bypass Mode" : `${user?.scopes.length || 0} Scopes`}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono text-muted-foreground">
              {user?.is_superuser
                ? "All actions authorized by Kernel"
                : user?.scopes.join(", ") || "No scopes assigned"}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardDescription className="font-mono text-xs text-muted-foreground">RESTRICTED FIELDS (ZCHEMA)</CardDescription>
              <CardTitle className="text-lg font-mono">
                {user?.all_restricted_fields.length || 0} Pruned Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono text-muted-foreground">
              {user?.all_restricted_fields.join(", ") || "None (Full visibility)"}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80 bg-card/40">
          <CardHeader>
            <div className="flex items-center gap-2 text-brand-500">
              <KeyRound className="h-5 w-5" />
              <CardTitle className="text-base font-mono">ZCore Declarative Scope Gate Test</CardTitle>
            </div>
            <CardDescription className="text-xs">
              This card demonstrates conditional UI rendering based on active JWT scopes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <ScopeGate
                scope="orders:create"
                fallback={
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20 flex items-center gap-3 text-muted-foreground">
                    <Lock className="h-4 w-4 text-zinc-500" />
                    <span>Checkout Actions Locked (Requires 'orders:create')</span>
                  </div>
                }
              >
                <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 flex items-center gap-3 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Authorized to Place Orders ('orders:create')</span>
                </div>
              </ScopeGate>

              <ScopeGate
                scope="notifications:broadcast"
                fallback={
                  <div className="p-4 rounded-lg border border-border/50 bg-secondary/20 flex items-center gap-3 text-muted-foreground">
                    <ShieldAlert className="h-4 w-4 text-zinc-500" />
                    <span>Broadcast Feature Locked (Requires 'notifications:broadcast')</span>
                  </div>
                }
              >
                <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/10 flex items-center gap-3 text-amber-400">
                  <CheckCircle2 className="h-4 w-4 text-amber-400" />
                  <span>Authorized for Realtime Broadcast ('notifications:broadcast')</span>
                </div>
              </ScopeGate>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}