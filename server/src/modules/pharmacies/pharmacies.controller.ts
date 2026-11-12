import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import * as service from "./pharmacies.service.js";

function userId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function getProfile(req: Request, res: Response) {
  res.json({ profile: await service.getProfileByUserId(userId(req)) });
}

export async function updateProfile(req: Request, res: Response) {
  res.json({ profile: await service.updateProfile(userId(req), req.body) });
}

export async function listLocations(req: Request, res: Response) {
  res.json({ locations: await service.listLocations(userId(req)) });
}

export async function createLocation(req: Request, res: Response) {
  res.status(201).json({ location: await service.createLocation(userId(req), req.body) });
}

export async function updateLocation(req: Request, res: Response) {
  res.json({ location: await service.updateLocation(userId(req), req.params.id, req.body) });
}

export async function deleteLocation(req: Request, res: Response) {
  await service.deleteLocation(userId(req), req.params.id);
  res.status(204).send();
}
