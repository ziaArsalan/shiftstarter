import type { CookieOptions, Request, Response } from "express";
import { env, isProd } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import * as service from "./auth.service.js";

const REFRESH_PATH = "/api/v1/auth";

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: REFRESH_PATH,
    maxAge: env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(env.REFRESH_COOKIE_NAME, token, cookieOptions());
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(env.REFRESH_COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}

function readRefreshToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[env.REFRESH_COOKIE_NAME];
  const fromBody = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined;
  return fromCookie || fromBody;
}

export async function register(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await service.register(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await service.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
}

export async function refresh(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await service.refresh(readRefreshToken(req));
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
}

export async function logout(req: Request, res: Response) {
  await service.logout(readRefreshToken(req));
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw AppError.unauthorized();
  res.json({ user: await service.me(req.user.id) });
}
