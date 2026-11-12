export type Role = 'ADMIN' | 'VET' | 'RECEPTION';
export type Species = 'PERRO' | 'GATO' | 'AVE' | 'ROEDOR' | 'REPTIL' | 'OTRO';
export type Sex = 'MACHO' | 'HEMBRA' | 'DESCONOCIDO';
export type AppointmentStatus = 'PROGRAMADA' | 'COMPLETADA' | 'CANCELADA';
export type RecordType =
  | 'CONSULTA'
  | 'VACUNA'
  | 'DESPARASITACION'
  | 'CIRUGIA'
  | 'OTRO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  documentId?: string | null;
  pets?: Pet[];
}

export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed?: string | null;
  sex: Sex;
  birthDate?: string | null;
  weightKg?: number | null;
  notes?: string | null;
  clientId: string;
  client?: Client;
}

export interface Appointment {
  id: string;
  date: string;
  reason: string;
  status: AppointmentStatus;
  notes?: string | null;
  petId: string;
  pet?: Pet;
  vetId?: string | null;
  vet?: { id: string; name: string } | null;
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: RecordType;
  diagnosis?: string | null;
  treatment?: string | null;
  weightKg?: number | null;
  notes?: string | null;
  nextVisit?: string | null;
  petId: string;
  vet?: { id: string; name: string } | null;
}

export const SPECIES_LABELS: Record<Species, string> = {
  PERRO: 'Perro',
  GATO: 'Gato',
  AVE: 'Ave',
  ROEDOR: 'Roedor',
  REPTIL: 'Reptil',
  OTRO: 'Otro',
};

export const SEX_LABELS: Record<Sex, string> = {
  MACHO: 'Macho',
  HEMBRA: 'Hembra',
  DESCONOCIDO: 'Desconocido',
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PROGRAMADA: 'Programada',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

export const RECORD_LABELS: Record<RecordType, string> = {
  CONSULTA: 'Consulta',
  VACUNA: 'Vacuna',
  DESPARASITACION: 'Desparasitación',
  CIRUGIA: 'Cirugía',
  OTRO: 'Otro',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  VET: 'Veterinario',
  RECEPTION: 'Recepción',
};
