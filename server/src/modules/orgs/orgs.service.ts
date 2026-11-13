import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import type {
  CreateLocationInput,
  InviteMemberInput,
  UpdateLocationInput,
  UpdateOrgInput,
} from "./orgs.schemas.js";

/**
 * Every query here is scoped to a single organizationId resolved from the
 * caller's membership (see middleware/rbac.ts resolveMembership). RLS is the
 * authoritative guard on the client path; this is the API-path tenant scoping.
 */

export async function getOrg(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { chain: true, _count: { select: { memberships: true, locations: true } } },
  });
  if (!org) throw AppError.notFound("Organization not found");
  return org;
}

export async function updateOrg(organizationId: string, input: UpdateOrgInput) {
  if (input.chainId) {
    const chain = await prisma.pharmacyChain.findUnique({ where: { id: input.chainId } });
    if (!chain) throw AppError.validation("Selected chain does not exist");
  }
  const data = { ...input };
  if (data.website === "") data.website = undefined;
  return prisma.organization.update({
    where: { id: organizationId },
    data,
    include: { chain: true },
  });
}

export async function listMembers(organizationId: string) {
  const members = await prisma.membership.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    include: { profile: { select: { id: true, email: true, fullName: true } } },
  });
  return members.map((m) => ({
    id: m.id,
    role: m.role,
    status: m.status,
    invitedEmail: m.invitedEmail,
    createdAt: m.createdAt,
    profile: m.profile,
  }));
}

export async function inviteMember(organizationId: string, input: InviteMemberInput) {
  // profileId is required on Membership, so the invitee must already have a
  // ShiftStarter account. Ask them to sign up first otherwise.
  const profile = await prisma.profile.findUnique({ where: { email: input.email } });
  if (!profile) {
    throw AppError.validation(
      "No ShiftStarter account uses that email yet. Ask them to sign up first.",
    );
  }

  const existing = await prisma.membership.findUnique({
    where: { organizationId_profileId: { organizationId, profileId: profile.id } },
  });
  if (existing && existing.status === "ACTIVE") {
    throw AppError.conflict("That person is already a member of this organization");
  }

  const membership = await prisma.membership.upsert({
    where: { organizationId_profileId: { organizationId, profileId: profile.id } },
    create: {
      organizationId,
      profileId: profile.id,
      role: input.role,
      status: "ACTIVE",
      invitedEmail: input.email,
    },
    update: { role: input.role, status: "ACTIVE", invitedEmail: input.email },
    include: { profile: { select: { id: true, email: true, fullName: true } } },
  });

  return {
    id: membership.id,
    role: membership.role,
    status: membership.status,
    invitedEmail: membership.invitedEmail,
    createdAt: membership.createdAt,
    profile: membership.profile,
  };
}

export async function removeMember(organizationId: string, membershipId: string) {
  const membership = await prisma.membership.findUnique({ where: { id: membershipId } });
  if (!membership || membership.organizationId !== organizationId) {
    throw AppError.notFound("Member not found");
  }
  if (membership.role === "OWNER") {
    const ownerCount = await prisma.membership.count({
      where: { organizationId, role: "OWNER", status: "ACTIVE" },
    });
    if (ownerCount <= 1) throw AppError.conflict("Cannot remove the last owner of the organization");
  }
  await prisma.membership.delete({ where: { id: membershipId } });
}

export async function listLocations(organizationId: string) {
  return prisma.pharmacyLocation.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    include: { chain: true },
  });
}

export async function createLocation(organizationId: string, input: CreateLocationInput) {
  if (input.chainId) {
    const chain = await prisma.pharmacyChain.findUnique({ where: { id: input.chainId } });
    if (!chain) throw AppError.validation("Selected chain does not exist");
  }
  return prisma.pharmacyLocation.create({ data: { ...input, organizationId } });
}

async function ownedLocationOrThrow(organizationId: string, locationId: string) {
  const location = await prisma.pharmacyLocation.findUnique({ where: { id: locationId } });
  if (!location || location.organizationId !== organizationId) {
    throw AppError.notFound("Location not found");
  }
  return location;
}

export async function updateLocation(
  organizationId: string,
  locationId: string,
  input: UpdateLocationInput,
) {
  await ownedLocationOrThrow(organizationId, locationId);
  if (input.chainId) {
    const chain = await prisma.pharmacyChain.findUnique({ where: { id: input.chainId } });
    if (!chain) throw AppError.validation("Selected chain does not exist");
  }
  return prisma.pharmacyLocation.update({ where: { id: locationId }, data: input });
}

export async function deleteLocation(organizationId: string, locationId: string) {
  await ownedLocationOrThrow(organizationId, locationId);
  // M3: block deletion when the location has shifts.
  await prisma.pharmacyLocation.delete({ where: { id: locationId } });
}
