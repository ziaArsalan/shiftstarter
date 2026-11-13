import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePlatformRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { adminChainsRouter } from "../chains/chains.routes.js";
import * as controller from "./admin.controller.js";
import {
  credentialIdParams,
  listCredentialsQuery,
  listOrgsQuery,
  listUsersQuery,
  reviewCredentialSchema,
  updateUserSchema,
  userIdParams,
} from "./admin.schemas.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requirePlatformRole("SUPER_ADMIN"));

adminRouter.get("/users", validate({ query: listUsersQuery }), asyncHandler(controller.listUsers));
adminRouter.patch(
  "/users/:id",
  validate({ params: userIdParams, body: updateUserSchema }),
  asyncHandler(controller.updateUser),
);

adminRouter.get("/orgs", validate({ query: listOrgsQuery }), asyncHandler(controller.listOrgs));

adminRouter.get(
  "/credentials",
  validate({ query: listCredentialsQuery }),
  asyncHandler(controller.listCredentials),
);
adminRouter.patch(
  "/credentials/:id",
  validate({ params: credentialIdParams, body: reviewCredentialSchema }),
  asyncHandler(controller.reviewCredential),
);

// Pharmacy-chain catalog management (super-admin CRUD + logo upload).
adminRouter.use("/chains", adminChainsRouter);
