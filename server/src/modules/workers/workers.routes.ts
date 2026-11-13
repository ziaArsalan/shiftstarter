import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireProfile, requireWorker } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { uploadSingle } from "../../middleware/upload.js";
import * as controller from "./workers.controller.js";
import {
  createCredentialSchema,
  credentialIdParams,
  updateWorkerProfileSchema,
} from "./workers.schemas.js";

export const workersRouter = Router();

workersRouter.use(requireAuth, requireProfile);

workersRouter.get("/me/profile", requireWorker, asyncHandler(controller.getProfile));
workersRouter.put(
  "/me/profile",
  requireWorker,
  validate({ body: updateWorkerProfileSchema }),
  asyncHandler(controller.updateProfile),
);

workersRouter.get("/me/credentials", requireWorker, asyncHandler(controller.listCredentials));
workersRouter.post(
  "/me/credentials",
  requireWorker,
  uploadSingle,
  validate({ body: createCredentialSchema }),
  asyncHandler(controller.createCredential),
);
workersRouter.delete(
  "/me/credentials/:id",
  requireWorker,
  validate({ params: credentialIdParams }),
  asyncHandler(controller.deleteCredential),
);
// Download is owner-or-super-admin; the service enforces ownership, super
// admins may view for credential review.
workersRouter.get(
  "/me/credentials/:id/file",
  validate({ params: credentialIdParams }),
  asyncHandler(controller.downloadCredential),
);
