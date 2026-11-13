import type { Request, Response } from "express";
import * as service from "./chains.service.js";

export async function listChains(_req: Request, res: Response) {
  res.json({ chains: await service.listChains() });
}

export async function createChain(req: Request, res: Response) {
  res.status(201).json({ chain: await service.createChain(req.body) });
}

export async function updateChain(req: Request, res: Response) {
  res.json({ chain: await service.updateChain(req.params.id, req.body) });
}

export async function deleteChain(req: Request, res: Response) {
  await service.deleteChain(req.params.id);
  res.status(204).send();
}

export async function uploadLogo(req: Request, res: Response) {
  res.json({ chain: await service.setLogo(req.params.id, req.file) });
}
