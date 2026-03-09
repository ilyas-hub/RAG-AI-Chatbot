import { Request } from 'express';

export interface AuthUser {
  id: string;
  scopes: string[];
  applicationRoles: string[];
  isGlobalSuperAdmin: boolean;
  isExternal: boolean;
}

export interface UnifiedAuthRequest extends Request {
  user: AuthUser;
}
