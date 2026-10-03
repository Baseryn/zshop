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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
          <UserCheck className="w-3.5 h-3.5 text-primary" />
          <span>PERSONA: {activePersona.toUpperCase()}</span>
        </Badge>
        <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>SCOPES: {user?.is_superuser ? "ALL (*)" : user?.scopes.length || 0}</span>
        </Badge>
        <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>PRUNED: {user?.all_restricted_fields.length || 0} fields</span>
        </Badge>
      </div>

      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-2 text-xs font-medium">
          <Terminal className="w-4 h-4 text-primary" />
          <span>Active Request Context (Hydrated via ZContext):</span>
        </div>
        <pre className="bg-secondary/40 p-4 rounded-xl border text-foreground font-mono text-xs leading-relaxed max-h-60 overflow-x-auto">
          {JSON.stringify(contextData, null, 2)}
        </pre>
      </div>
    </div>
  );
}