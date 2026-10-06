import { useDevToolsStore, DevToolsTab } from "@/stores/devtoolsStore";
import { ContextInspector } from "./ContextInspector";
import { NetworkTracker } from "./NetworkTracker";
import { DynamicSchemaViewer } from "./DynamicSchemaViewer";
import { SSEMonitor } from "./SSEMonitor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, ChevronUp, ChevronDown, Activity, Code, Shield, Radio } from "lucide-react";

export function ZCoreDock() {
  const { isOpen, toggleOpen, activeTab, setActiveTab, metrics } = useDevToolsStore();

  return (
    <aside aria-label="ZCore Live Inspector Dock" className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center">
      <div className="w-full max-w-screen-xl px-4 flex justify-end">
        <Button
          onClick={toggleOpen}
          size="sm"
          className="h-9 gap-2 bg-card hover:bg-accent border border-b-0 text-foreground text-xs rounded-t-xl rounded-b-none shadow-xl px-4 transition-all"
        >
          <Terminal className="w-4 h-4 text-primary" />
          <span className="font-semibold">ZCore Live Inspector</span>
          {metrics.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-full">
              {metrics.length}
            </Badge>
          )}
          {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
        </Button>
      </div>

      {isOpen && (
        <div className="w-full bg-card border-t shadow-2xl backdrop-blur-xl transition-all duration-200">
          <div className="container max-w-screen-xl px-4 py-4">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as DevToolsTab)}>
              <div className="flex items-center justify-between pb-3 border-b">
                <TabsList className="h-9 p-1 rounded-lg">
                  <TabsTrigger value="context" className="text-xs gap-1.5 rounded-md">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    Context & Zchema
                  </TabsTrigger>
                  <TabsTrigger value="network" className="text-xs gap-1.5 rounded-md">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    Request Tracker
                    {metrics.length > 0 && (
                      <span className="text-[10px] text-muted-foreground ml-1">({metrics.length})</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="schema" className="text-xs gap-1.5 rounded-md">
                    <Code className="w-3.5 h-3.5 text-amber-500" />
                    Dynamic Schema
                  </TabsTrigger>
                  <TabsTrigger value="sse" className="text-xs gap-1.5 rounded-md">
                    <Radio className="w-3.5 h-3.5 text-emerald-500" />
                    SSE Stream
                  </TabsTrigger>
                </TabsList>

                <div className="text-xs text-muted-foreground hidden sm:block font-medium">
                  ZShop Framework Inspection Console
                </div>
              </div>

              <div className="pt-3">
                <TabsContent value="context" className="mt-0 focus-visible:outline-none">
                  <ContextInspector />
                </TabsContent>
                <TabsContent value="network" className="mt-0 focus-visible:outline-none">
                  <NetworkTracker />
                </TabsContent>
                <TabsContent value="schema" className="mt-0 focus-visible:outline-none">
                  <DynamicSchemaViewer />
                </TabsContent>
                <TabsContent value="sse" className="mt-0 focus-visible:outline-none">
                  <SSEMonitor />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      )}
    </aside>
  );
}