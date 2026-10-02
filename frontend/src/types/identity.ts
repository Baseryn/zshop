export interface UserResponse {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  is_verify: boolean;
  is_superuser: boolean;
  is_staff: boolean;
  scopes: string[];
  all_restricted_fields: string[];
  last_login?: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export type PersonaType = "guest" | "customer" | "manager" | "admin";

export interface PersonaConfig {
  id: PersonaType;
  label: string;
  roleTitle: string;
  email: string;
  password?: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  description: string;
  badgeClass?: string;
}