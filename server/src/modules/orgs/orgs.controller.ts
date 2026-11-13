import type { Request, Response } from "express";
import { resolveMembership } from "../../middleware/rbac.js";
import * as service from "./orgs.service.js";

function orgId(req: Request): string {
  return resolveMembership(req).organizationId;
}

export async function getOrg(req: Request, res: Response) {
  res.json({ organization: await service.getOrg(orgId(req)) });
}

export async function updateOrg(req: Request, res: Response) {
  res.json({ organization: await service.updateOrg(orgId(req), req.body) });
}

export async function listMembers(req: Request, res: Response) {
  res.json({ members: await service.listMembers(orgId(req)) });
}

export async function inviteMember(req: Request, res: Response) {
  res.status(201).json({ member: await service.inviteMember(orgId(req), req.body) });
}

export async function removeMember(req: Request, res: Response) {
  await service.removeMember(orgId(req), req.params.id);
  res.status(204).send();
}

export async function listLocations(req: Request, res: Response) {
  res.json({ locations: await service.listLocations(orgId(req)) });
}

export async function createLocation(req: Request, res: Response) {
  res.status(201).json({ location: await service.createLocation(orgId(req), req.body) });
}

export async function updateLocation(req: Request, res: Response) {
  res.json({ location: await service.updateLocation(orgId(req), req.params.id, req.body) });
}

export async function deleteLocation(req: Request, res: Response) {
  await service.deleteLocation(orgId(req), req.params.id);
  res.status(204).send();
}
