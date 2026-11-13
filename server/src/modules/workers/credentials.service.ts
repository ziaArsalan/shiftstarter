import crypto from "node:crypto";
import path from "node:path";
import { fileTypeFromBuffer } from "file-type";
import type { CredentialType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import { storage } from "../../lib/storage/index.js";
import { ALLOWED_MIME } from "../../middleware/upload.js";
import { requireProfileId } from "./workers.service.js";

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

/** Keep only a safe basename, collapse unsafe characters, cap length. */
function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^\.+/, "");
  const trimmed = base.slice(0, 120);
  return trimmed || "upload";
}

export async function listCredentials(userId: string) {
  const workerId = await requireProfileId(userId);
  return prisma.credential.findMany({
    where: { workerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
      issuedAt: true,
      expiresAt: true,
      reviewedAt: true,
      notes: true,
      createdAt: true,
    },
  });
}

export async function createCredential(
  userId: string,
  input: { type: CredentialType; issuedAt?: Date; expiresAt?: Date },
  file: Express.Multer.File | undefined,
) {
  if (!file) throw AppError.validation("A file is required (field `file`)");

  // Verify true content type via magic bytes, not the client-declared header.
  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !ALLOWED_MIME.includes(detected.mime as (typeof ALLOWED_MIME)[number])) {
    throw new AppError(
      "UNSUPPORTED_MEDIA_TYPE",
      415,
      "File content is not a valid PDF, JPEG, or PNG",
    );
  }

  const workerId = await requireProfileId(userId);
  const ext = EXT_BY_MIME[detected.mime] ?? "";
  const key = `${workerId}/${crypto.randomUUID()}${ext}`;

  await storage.save(key, file.buffer, detected.mime);

  try {
    return await prisma.credential.create({
      data: {
        workerId,
        type: input.type,
        fileUrl: key,
        fileName: sanitizeFilename(file.originalname),
        mimeType: detected.mime,
        sizeBytes: file.size,
        issuedAt: input.issuedAt,
        expiresAt: input.expiresAt,
      },
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        issuedAt: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  } catch (err) {
    // Roll back the stored file if the DB insert fails.
    await storage.delete(key).catch(() => undefined);
    throw err;
  }
}

export async function deleteCredential(userId: string, credentialId: string) {
  const workerId = await requireProfileId(userId);
  const credential = await prisma.credential.findUnique({ where: { id: credentialId } });
  if (!credential || credential.workerId !== workerId) {
    throw AppError.notFound("Credential not found");
  }
  await prisma.credential.delete({ where: { id: credentialId } });
  await storage.delete(credential.fileUrl).catch(() => undefined);
}

/** Fetch a credential for download, enforcing owner-or-super-admin access. */
export async function getCredentialFile(
  requester: { userId: string; isSuperAdmin: boolean },
  credentialId: string,
) {
  const credential = await prisma.credential.findUnique({
    where: { id: credentialId },
    include: { worker: { select: { profileId: true } } },
  });
  if (!credential) throw AppError.notFound("Credential not found");

  const isOwner = credential.worker.profileId === requester.userId;
  if (!isOwner && !requester.isSuperAdmin) throw AppError.notFound("Credential not found");

  if (!(await storage.exists(credential.fileUrl))) {
    throw AppError.notFound("Stored file is missing");
  }

  return {
    stream: await storage.createReadStream(credential.fileUrl),
    mimeType: credential.mimeType,
    fileName: credential.fileName,
  };
}
