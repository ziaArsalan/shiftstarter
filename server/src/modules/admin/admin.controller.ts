import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import type { PlatformRole, UserStatus, VerificationStatus } from "@prisma/client";
import * as service from "./admin.service.js";

export async function listUsers(req: Request, res: Response) {
  const q = req.query as unknown as {
    platformRole?: PlatformRole;
    status?: UserStatus;
    q?: string;
    page: number;
    pageSize: number;
  };
  res.json(await service.listUsers(q));
}

export async function updateUser(req: Request, res: Response) {
  const updated = await service.updateUserStatus(getAuth(req).userId, req.params.id, req.body.status);
  res.json({ user: updated });
}

export async function listOrgs(req: Request, res: Response) {
  const q = req.query as unknown as { q?: string; page: number; pageSize: number };
  res.json(await service.listOrgs(q));
}

export async function listCredentials(req: Request, res: Response) {
  const q = req.query as unknown as {
    status?: VerificationStatus;
    page: number;
    pageSize: number;
  };
  res.json(await service.listCredentials(q));
}

export async function reviewCredential(req: Request, res: Response) {
  const { action, notes } = req.body as { action: "approve" | "reject"; notes?: string };
  const credential = await service.reviewCredential(getAuth(req).userId, req.params.id, action, notes);
  res.json({ credential });
}
