import type { Request, Response } from "express";
import { getAuth } from "../../middleware/auth.js";
import * as service from "./auth.service.js";

export async function me(req: Request, res: Response) {
  res.json(await service.me(getAuth(req)));
}

export async function bootstrap(req: Request, res: Response) {
  res.status(201).json(await service.bootstrap(getAuth(req), req.body));
}
