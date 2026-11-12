export type Role = "WORKER" | "PHARMACY" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type CredentialType =
  | "LICENSE"
  | "GOVERNMENT_ID"
  | "CERTIFICATION"
  | "INSURANCE"
  | "OTHER";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  profile?: { id: string; displayName: string } | null;
}

export interface WorkerProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  professionalTitle: string | null;
  licenseNumber: string | null;
  yearsExperience: number | null;
  bio: string | null;
  hourlyRateExpectation: number | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Credential {
  id: string;
  type: CredentialType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: VerificationStatus;
  issuedAt: string | null;
  expiresAt: string | null;
  reviewedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PharmacyProfile {
  id: string;
  businessName: string;
  description: string | null;
  contactPhone: string | null;
  website: string | null;
}

export interface PharmacyLocation {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

export interface AdminUserRow {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  displayName: string | null;
}

export interface AdminCredentialRow extends Credential {
  reviewedBy: string | null;
  worker: { id: string; name: string; email: string };
}

export interface Paged<T> {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  users?: T[];
  credentials?: T[];
}
