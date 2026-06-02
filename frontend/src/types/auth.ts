export interface User {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  rol: 'ADMIN' | 'ASESOR';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
}
