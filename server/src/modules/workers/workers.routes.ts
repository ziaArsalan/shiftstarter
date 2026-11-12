import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { uploadSingle } from "../../middleware/upload.js";
import * as controller from "./workers.controller.js";
import {
  createCredentialSchema,
  credentialIdParams,
  updateWorkerProfileSchema,
} from "./workers.schemas.js";

export const workersRouter = Router();

// All worker routes require authentication.
workersRouter.use(requireAuth);

const workerOnly = requireRole("WORKER");

workersRouter.get("/me/profile", workerOnly, asyncHandler(controller.getProfile));
workersRouter.put(
  "/me/profile",
  workerOnly,
  validate({ body: updateWorkerProfileSchema }),
  asyncHandler(controller.updateProfile),
);

workersRouter.get("/me/credentials", workerOnly, asyncHandler(controller.listCredentials));
workersRouter.post(
  "/me/credentials",
  workerOnly,
  uploadSingle,
  validate({ body: createCredentialSchema }),
  asyncHandler(controller.createCredential),
);
workersRouter.delete(
  "/me/credentials/:id",
  workerOnly,
  validate({ params: credentialIdParams }),
  asyncHandler(controller.deleteCredential),
);
// Download is owner-or-admin; the service enforces ownership, admins may view for review.
workersRouter.get(
  "/me/credentials/:id/file",
  requireRole("WORKER", "ADMIN"),
  validate({ params: credentialIdParams }),
  asyncHandler(controller.downloadCredential),
);
