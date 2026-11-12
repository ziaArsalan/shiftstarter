import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import * as service from "./admin.service.js";

function adminId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function listUsers(req: Request, res: Response) {
  const q = req.query as unknown as {
    role?: "WORKER" | "PHARMACY" | "ADMIN";
    status?: "ACTIVE" | "SUSPENDED" | "PENDING";
    page: number;
    pageSize: number;
  };
  res.json(await service.listUsers(q));
}

export async function updateUser(req: Request, res: Response) {
  const updated = await service.updateUserStatus(adminId(req), req.params.id, req.body.status);
  res.json({ user: updated });
}

export async function listCredentials(req: Request, res: Response) {
  const q = req.query as unknown as {
    status?: "PENDING" | "APPROVED" | "REJECTED";
    page: number;
    pageSize: number;
  };
  res.json(await service.listCredentials(q));
}

export async function reviewCredential(req: Request, res: Response) {
  const { action, notes } = req.body as { action: "approve" | "reject"; notes?: string };
  const credential = await service.reviewCredential(adminId(req), req.params.id, action, notes);
  res.json({ credential });
}
