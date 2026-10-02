import { PersonaConfig } from "@/types/identity";

export const SEED_PERSONAS: Record<string, PersonaConfig> = {
  admin: {
    id: "admin",
    label: "SuperAdmin",
    roleTitle: "👑 SuperAdmin",
    email: "admin@zshop.io",
    password: "SuperSecret123!",
    badgeVariant: "default",
    badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
    description: "Bypasses all scope checks via is_superuser=True",
  },
  manager: {
    id: "manager",
    label: "Store Manager",
    roleTitle: "👔 Store Manager",
    email: "manager@zshop.io",
    password: "ManagerSecret123!",
    badgeVariant: "secondary",
    badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    description: "Evaluated strictly by HasScopes (catalog, orders, broadcast)",
  },
  customer: {
    id: "customer",
    label: "Customer",
    roleTitle: "👤 Customer",
    email: "john@example.com",
    password: "CustomerSecret123!",
    badgeVariant: "outline",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description: "Tests Zchema data pruning (cost_price is hidden)",
  },
  guest: {
    id: "guest",
    label: "Guest (Public)",
    roleTitle: "🚪 Guest",
    email: "",
    badgeVariant: "outline",
    badgeClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    description: "Unauthenticated context",
  },
};