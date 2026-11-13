import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { fileTypeFromBuffer } from "file-type";
import { prisma } from "../../lib/prisma.js";
import { supabaseAdmin } from "../../lib/supabase.js";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { ALLOWED_IMAGE_MIME } from "../../middleware/upload.js";
import type { CreateChainInput, UpdateChainInput } from "./chains.schemas.js";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

/** Catalog read — available to any authenticated user for chain selection. */
export function listChains() {
  return prisma.pharmacyChain.findMany({ orderBy: { name: "asc" } });
}

export async function createChain(input: CreateChainInput) {
  const slug = input.slug ?? slugify(input.name);
  if (!slug) throw AppError.validation("Could not derive a slug from the name");
  try {
    return await prisma.pharmacyChain.create({
      data: {
        name: input.name,
        slug,
        website: input.website || null,
        logoUrl: input.logoUrl || null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw AppError.conflict("A chain with that name or slug already exists");
    }
    throw err;
  }
}

export async function updateChain(id: string, input: UpdateChainInput) {
  await requireChain(id);
  try {
    return await prisma.pharmacyChain.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.website !== undefined ? { website: input.website || null } : {}),
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl || null } : {}),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw AppError.conflict("A chain with that name or slug already exists");
    }
    throw err;
  }
}

export async function deleteChain(id: string) {
  await requireChain(id);
  const [orgs, locations] = await Promise.all([
    prisma.organization.count({ where: { chainId: id } }),
    prisma.pharmacyLocation.count({ where: { chainId: id } }),
  ]);
  if (orgs > 0 || locations > 0) {
    throw AppError.conflict("Cannot delete a chain that is still in use by organizations or locations");
  }
  await prisma.pharmacyChain.delete({ where: { id } });
}

export async function setLogo(id: string, file: Express.Multer.File | undefined) {
  const chain = await requireChain(id);
  if (!file) throw AppError.validation("A logo image is required (field `logo`)");

  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !ALLOWED_IMAGE_MIME.includes(detected.mime as (typeof ALLOWED_IMAGE_MIME)[number])) {
    throw new AppError("UNSUPPORTED_MEDIA_TYPE", 415, "Logo must be a valid JPEG or PNG image");
  }

  const ext = EXT_BY_MIME[detected.mime] ?? "";
  const key = `chains/${chain.slug}-${crypto.randomUUID()}${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(env.BRAND_ASSETS_BUCKET)
    .upload(key, file.buffer, { contentType: detected.mime, upsert: true });
  if (error) throw error;

  const { data } = supabaseAdmin.storage.from(env.BRAND_ASSETS_BUCKET).getPublicUrl(key);

  return prisma.pharmacyChain.update({
    where: { id },
    data: { logoUrl: data.publicUrl },
  });
}

async function requireChain(id: string) {
  const chain = await prisma.pharmacyChain.findUnique({ where: { id } });
  if (!chain) throw AppError.notFound("Chain not found");
  return chain;
}
