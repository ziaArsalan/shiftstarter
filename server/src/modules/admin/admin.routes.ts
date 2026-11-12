import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./admin.controller.js";
import {
  credentialIdParams,
  listCredentialsQuery,
  listUsersQuery,
  reviewCredentialSchema,
  updateUserSchema,
  userIdParams,
} from "./admin.schemas.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/users", validate({ query: listUsersQuery }), asyncHandler(controller.listUsers));
adminRouter.patch(
  "/users/:id",
  validate({ params: userIdParams, body: updateUserSchema }),
  asyncHandler(controller.updateUser),
);

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
