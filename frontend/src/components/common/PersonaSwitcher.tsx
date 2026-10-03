import { useAuthStore } from "@/stores/authStore";
import { SEED_PERSONAS } from "@/lib/constants";
import { PersonaType } from "@/types/identity";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Shield, RefreshCw } from "lucide-react";

export function PersonaSwitcher() {
  const { activePersona, switchPersona, isLoading, user } = useAuthStore();
  const currentConfig = SEED_PERSONAS[activePersona] || SEED_PERSONAS.guest;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="h-9 gap-2 rounded-lg px-3 text-xs"
          >
            {isLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <Shield className="h-3.5 w-3.5 text-primary" />
            )}
            <span className="font-semibold">{currentConfig.roleTitle}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-2 rounded-xl shadow-lg">
          <DropdownMenuLabel className="flex items-center justify-between text-muted-foreground pb-1 text-xs">
            <span>ZCORE CONTEXT PERSONA</span>
            <span className="text-[10px] text-primary font-mono">1-CLICK RBAC SWITCH</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {(Object.keys(SEED_PERSONAS) as PersonaType[]).map((key) => {
            const p = SEED_PERSONAS[key];
            const isSelected = activePersona === key;

            return (
              <DropdownMenuItem
                key={p.id}
                onClick={() => switchPersona(p.id)}
                className={`flex flex-col items-start gap-1 p-2.5 cursor-pointer rounded-lg transition-colors ${
                  isSelected ? "bg-accent border border-border/80" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-foreground text-sm">{p.roleTitle}</span>
                  <Badge variant={p.badgeVariant} className={`text-[10px] px-2 py-0.5 rounded-full ${p.badgeClass || ""}`}>
                    {p.id.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {p.description}
                </p>
                {p.email && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {p.email}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {user && (
        <Badge variant="secondary" className="hidden sm:inline-flex text-xs rounded-full">
          Scopes: {user.is_superuser ? "ALL (*)" : user.scopes.length}
        </Badge>
      )}
    </div>
  );
}