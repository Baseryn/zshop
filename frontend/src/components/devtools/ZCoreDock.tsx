import { useDevToolsStore, DevToolsTab } from "@/stores/devtoolsStore";
import { ContextInspector } from "./ContextInspector";
import { NetworkTracker } from "./NetworkTracker";
import { DynamicSchemaViewer } from "./DynamicSchemaViewer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, ChevronUp, ChevronDown, Activity, Code, Shield } from "lucide-react";

export function ZCoreDock() {
  const { isOpen, toggleOpen, activeTab, setActiveTab, metrics } = useDevToolsStore();

  return (
    <aside aria-label="ZCore Live Inspector Dock" className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center">
      <div className="w-full max-w-screen-xl px-4 flex justify-end">
        <Button
          onClick={toggleOpen}
          size="sm"
          className="h-8 gap-2 bg-zinc-950/90 hover:bg-zinc-900 border border-border/80 text-foreground font-mono text-xs rounded-t-lg rounded-b-none shadow-2xl backdrop-blur-md px-3"
        >
          <Terminal className="w-3.5 h-3.5 text-brand-500" />
          <span className="font-semibold">ZCore Live Inspector</span>
          {metrics.length > 0 && (
            <Badge variant="outline" className="h-4 px-1 text-[10px] bg-brand-500/10 text-brand-500 border-brand-500/30">
              {metrics.length}
            </Badge>
          )}
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {isOpen && (
        <div className="w-full bg-card/95 border-t border-border/80 shadow-2xl backdrop-blur-xl transition-all duration-200">
          <div className="container max-w-screen-xl px-4 py-3">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as DevToolsTab)}>
              <div className="flex items-center justify-between pb-2">
                <TabsList className="bg-secondary/40 border border-border/50 h-8">
                  <TabsTrigger value="context" className="text-xs font-mono gap-1.5 h-7">
                    <Shield className="w-3 h-3 text-brand-500" />
                    Context & Zchema
                  </TabsTrigger>
                  <TabsTrigger value="network" className="text-xs font-mono gap-1.5 h-7">
                    <Activity className="w-3 h-3 text-cyber-500" />
                    Request Tracker
                    {metrics.length > 0 && (
                      <span className="text-[10px] text-muted-foreground ml-1">({metrics.length})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="schema" className="text-xs font-mono gap-1.5 h-7">
                    <Code className="w-3 h-3 text-manager-500" />
                    Dynamic Schema
                  </TabsTrigger>
                </TabsList>

                <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
                  ZShop Framework Inspection Console
                </div>
              </div>

              <div className="pt-2">
                <TabsContent value="context" className="mt-0 focus-visible:outline-none">
                  <ContextInspector />
                </TabsContent>
                <TabsContent value="network" className="mt-0 focus-visible:outline-none">
                  <NetworkTracker />
                </TabsContent>
                <TabsContent value="schema" className="mt-0 focus-visible:outline-none">
                  <DynamicSchemaViewer />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      )}
    </aside>
  );
}