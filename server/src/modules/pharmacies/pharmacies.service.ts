import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import type {
  CreateLocationInput,
  UpdateLocationInput,
  UpdatePharmacyProfileInput,
} from "./pharmacies.schemas.js";

async function requirePharmacyId(userId: string): Promise<string> {
  const profile = await prisma.pharmacyProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) throw AppError.notFound("Pharmacy profile not found");
  return profile.id;
}

export async function getProfileByUserId(userId: string) {
  const profile = await prisma.pharmacyProfile.findUnique({ where: { userId } });
  if (!profile) throw AppError.notFound("Pharmacy profile not found");
  return profile;
}

export async function updateProfile(userId: string, input: UpdatePharmacyProfileInput) {
  await requirePharmacyId(userId);
  const data = { ...input };
  if (data.website === "") data.website = undefined;
  return prisma.pharmacyProfile.update({ where: { userId }, data });
}

export async function listLocations(userId: string) {
  const pharmacyId = await requirePharmacyId(userId);
  return prisma.pharmacyLocation.findMany({
    where: { pharmacyId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createLocation(userId: string, input: CreateLocationInput) {
  const pharmacyId = await requirePharmacyId(userId);
  return prisma.pharmacyLocation.create({ data: { ...input, pharmacyId } });
}

async function ownedLocationOrThrow(pharmacyId: string, locationId: string) {
  const location = await prisma.pharmacyLocation.findUnique({ where: { id: locationId } });
  if (!location || location.pharmacyId !== pharmacyId) {
    throw AppError.notFound("Location not found");
  }
  return location;
}

export async function updateLocation(userId: string, locationId: string, input: UpdateLocationInput) {
  const pharmacyId = await requirePharmacyId(userId);
  await ownedLocationOrThrow(pharmacyId, locationId);
  return prisma.pharmacyLocation.update({ where: { id: locationId }, data: input });
}

export async function deleteLocation(userId: string, locationId: string) {
  const pharmacyId = await requirePharmacyId(userId);
  await ownedLocationOrThrow(pharmacyId, locationId);
  // M3: block deletion when the location has shifts.
  await prisma.pharmacyLocation.delete({ where: { id: locationId } });
}
