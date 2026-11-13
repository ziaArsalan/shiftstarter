export type PlatformRole = "USER" | "SUPER_ADMIN";
export type OrgRole = "OWNER" | "MANAGER";
export type MembershipStatus = "ACTIVE" | "INVITED" | "REMOVED";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING";
export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type WorkerRole =
  | "PHARMACIST"
  | "PHARMACY_TECHNICIAN"
  | "PHARMACY_ASSISTANT"
  | "PHARMACY_STUDENT";
export type CredentialType =
  | "LICENSE"
  | "GOVERNMENT_ID"
  | "CERTIFICATION"
  | "INSURANCE"
  | "OTHER";

export const WORKER_ROLE_LABELS: Record<WorkerRole, string> = {
  PHARMACIST: "Pharmacist",
  PHARMACY_TECHNICIAN: "Pharmacy Technician",
  PHARMACY_ASSISTANT: "Pharmacy Assistant",
  PHARMACY_STUDENT: "Pharmacy Student",
};

export interface Profile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  platformRole: PlatformRole;
  status: UserStatus;
  createdAt: string;
}

export interface PharmacyChain {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
  createdAt?: string;
}

export interface Organization {
  id: string;
  type: string;
  name: string;
  chainId: string | null;
  description: string | null;
  contactPhone: string | null;
  website: string | null;
  status: UserStatus;
  chain?: PharmacyChain | null;
  _count?: { memberships: number; locations: number };
}

export interface OrgMembershipSummary {
  membershipId: string;
  role: OrgRole;
  status: MembershipStatus;
  organization: Organization;
}

export interface Capabilities {
  provisioned: boolean;
  isSuperAdmin: boolean;
  isWorker: boolean;
  isOrgOwner: boolean;
  isOrgManager: boolean;
}

export interface WorkerProfile {
  id: string;
  workerRole: WorkerRole;
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
  fullName: string | null;
  phone: string | null;
  email: string;
}

export interface MeResponse {
  profile: Profile | null;
  worker: WorkerProfile | null;
  organizations: OrgMembershipSummary[];
  capabilities: Capabilities;
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

export interface OrgMember {
  id: string;
  role: OrgRole;
  status: MembershipStatus;
  invitedEmail: string | null;
  createdAt: string;
  profile: { id: string; email: string; fullName: string | null };
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
  chainId: string | null;
  chain?: PharmacyChain | null;
  latitude: number | null;
  longitude: number | null;
}

export interface AdminUserRow {
  id: string;
  email: string;
  fullName: string | null;
  platformRole: PlatformRole;
  status: UserStatus;
  createdAt: string;
  workerRole: WorkerRole | null;
  orgCount: number;
}

export interface AdminOrgRow {
  id: string;
  name: string;
  type: string;
  status: UserStatus;
  createdAt: string;
  chain: { id: string; name: string; logoUrl: string | null } | null;
  memberCount: number;
  locationCount: number;
}

export interface AdminCredentialRow extends Credential {
  reviewedBy: string | null;
  worker: { id: string; workerRole: WorkerRole; name: string | null; email: string };
}

export interface Paged<T> {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  users?: T[];
  orgs?: T[];
  credentials?: T[];
}
