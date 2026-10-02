import React from "react";
import { useAuthStore } from "@/stores/authStore";

interface ScopeGateProps {
  scope?: string;
  scopes?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function ScopeGate({
  scope,
  scopes = [],
  requireAll = false,
  fallback = null,
  children,
}: ScopeGateProps) {
  const { user, hasScope } = useAuthStore();

  if (!user) return <>{fallback}</>;
  if (user.is_superuser) return <>{children}</>;

  const targetScopes = scope ? [scope, ...scopes] : scopes;

  const isAuthorized = requireAll
    ? targetScopes.every((s) => hasScope(s))
    : targetScopes.some((s) => hasScope(s));

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}