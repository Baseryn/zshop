import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Activity, ShieldCheck } from "lucide-react";

interface HealthResponse {
  status: string;
  service: string;
  framework: string;
  version: string;
  debug: boolean;
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add("dark");

    apiClient<HealthResponse>("/")
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border p-6 rounded-lg shadow-xl space-y-4">
        <div className="flex items-center space-x-3 text-brand-500">
          <ShieldCheck className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight text-white">ZShop Frontend</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          Showcase Reference Implementation for{" "}
          <span className="text-brand-500 font-mono">fastapi-zcore-framework</span>
        </p>

        <div className="border-t border-border pt-4">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-muted-foreground mb-2">
            <Activity className="w-4 h-4 text-cyber-500 animate-pulse" />
            <span>Backend Health Status</span>
          </div>

          {loading && (
            <p className="text-sm font-mono text-muted-foreground animate-pulse">
              Connecting to ZCore API...
            </p>
          )}

          {error && (
            <div className="p-3 bg-destructive/20 border border-destructive text-destructive-foreground rounded text-xs font-mono">
              Error connecting to backend: {error}
            </div>
          )}

          {health && (
            <div className="bg-secondary/40 p-3 rounded text-xs font-mono space-y-1">
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className="text-brand-500 font-semibold">{health.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Framework:</span> {health.framework}
              </div>
              <div>
                <span className="text-muted-foreground">Version:</span> {health.version}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}