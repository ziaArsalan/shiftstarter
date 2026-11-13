import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import * as profiles from "./workers.service.js";
import * as credentials from "./credentials.service.js";

export async function getProfile(req: Request, res: Response) {
  res.json({ profile: await profiles.getProfileByUserId(getAuth(req).userId) });
}

export async function updateProfile(req: Request, res: Response) {
  res.json({ profile: await profiles.updateProfile(getAuth(req).userId, req.body) });
}

export async function listCredentials(req: Request, res: Response) {
  res.json({ credentials: await credentials.listCredentials(getAuth(req).userId) });
}

export async function createCredential(req: Request, res: Response) {
  const credential = await credentials.createCredential(getAuth(req).userId, req.body, req.file);
  res.status(201).json({ credential });
}

export async function deleteCredential(req: Request, res: Response) {
  await credentials.deleteCredential(getAuth(req).userId, req.params.id);
  res.status(204).send();
}

export async function downloadCredential(req: Request, res: Response) {
  const auth = getAuth(req);
  const { stream, mimeType, fileName } = await credentials.getCredentialFile(
    { userId: auth.userId, isSuperAdmin: auth.profile?.platformRole === "SUPER_ADMIN" },
    req.params.id,
  );
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  stream.on("error", () => res.destroy());
  stream.pipe(res);
}
