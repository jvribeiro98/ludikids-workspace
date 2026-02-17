/**
 * Tipos compartilhados entre API e Web
 */

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    tenantId: string;
  };
  expiresIn: number;
}
