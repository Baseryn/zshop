import { PersonaSwitcher } from "./PersonaSwitcher";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-500">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              ZShop
            </span>
          </div>

          <Badge variant="outline" className="text-[10px] font-mono bg-secondary/50 text-muted-foreground border-border">
            ZCore v0.1.0-rc.2
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <PersonaSwitcher />
        </div>
      </div>
    </header>
  );
}