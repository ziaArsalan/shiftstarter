import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import * as profiles from "./workers.service.js";
import * as credentials from "./credentials.service.js";

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function getProfile(req: Request, res: Response) {
  res.json({ profile: await profiles.getProfileByUserId(userId(req)) });
}

export async function updateProfile(req: Request, res: Response) {
  res.json({ profile: await profiles.updateProfile(userId(req), req.body) });
}

export async function listCredentials(req: Request, res: Response) {
  res.json({ credentials: await credentials.listCredentials(userId(req)) });
}

export async function createCredential(req: Request, res: Response) {
  const credential = await credentials.createCredential(userId(req), req.body, req.file);
  res.status(201).json({ credential });
}

export async function deleteCredential(req: Request, res: Response) {
  await credentials.deleteCredential(userId(req), req.params.id);
  res.status(204).send();
}

export async function downloadCredential(req: Request, res: Response) {
  if (!req.user) throw AppError.unauthorized();
  const { stream, mimeType, fileName } = await credentials.getCredentialFile(
    req.user,
    req.params.id,
  );
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  stream.on("error", () => res.destroy());
  stream.pipe(res);
}
