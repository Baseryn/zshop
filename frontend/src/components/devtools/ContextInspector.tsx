import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, UserCheck, Terminal } from "lucide-react";

export function ContextInspector() {
  const { user, activePersona } = useAuthStore();

  const contextData = {
    user_id: user?.id || null,
    username: user?.username || "anonymous",
    is_superuser: user?.is_superuser || false,
    is_staff: user?.is_staff || false,
    scopes: user?.scopes || [],
    restricted_fields: user?.all_restricted_fields || [],
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/40">
        <Badge variant="outline" className="gap-1 bg-secondary/30">
          <UserCheck className="w-3 h-3 text-brand-500" />
          <span>PERSONA: {activePersona.toUpperCase()}</span>
        </Badge>
        <Badge variant="outline" className="gap-1 bg-secondary/30">
          <Shield className="w-3 h-3 text-cyber-500" />
          <span>SCOPES: {user?.is_superuser ? "ALL (*)" : user?.scopes.length || 0}</span>
        </Badge>
        <Badge variant="outline" className="gap-1 bg-secondary/30">
          <Lock className="w-3 h-3 text-manager-500" />
          <span>PRUNED: {user?.all_restricted_fields.length || 0} fields</span>
        </Badge>
      </div>

      <div>
        <div className="flex items-center gap-1.5 text-muted-foreground mb-1 text-[11px]">
          <Terminal className="w-3.5 h-3.5 text-brand-500" />
          <span>Active Request Context (Hydrated via ZContext):</span>
        </div>
        <pre className="bg-zinc-950 p-3 rounded-lg border border-border/60 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed max-h-56">
          {JSON.stringify(contextData, null, 2)}
        </pre>
      </div>
    </div>
  );
}