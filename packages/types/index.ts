// packages/types/index.ts

export interface Status {
  nombre: string;
}

export interface Raspberry {
  id: number;
  nombre: string;
  macAddress: string;
  ipAddress: string;
  Status?: Status; // <-- Añade '?' para hacerlo opcional
}

export interface Site {
  id: number;
  nombre: string;
  ubicacion: string;
  Raspberries: Raspberry[];
}

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}